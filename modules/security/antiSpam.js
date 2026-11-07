// ==========================================
//  VirBot v2 — Anti-Spam / Caps / Karaliste
// ==========================================
'use strict';

const fs   = require('fs');
const path = require('path');
const { SPAM } = require('../../config/config');
const { spamKayit } = require('../data/dataManager');

// ─── Karaliste Yükle ───────────────────────────────────────
let karaliste = [];
const tekilKelimeler = new Set();
const kaliplar = [];

try {
  const dosyaYolu = path.join(__dirname, '..', '..', 'karaliste.txt');
  if (fs.existsSync(dosyaYolu)) {
    const dosya = fs.readFileSync(dosyaYolu, 'utf8');
    karaliste = dosya
      .split(/\r?\n/)
      .map(k => k.trim().toLocaleLowerCase('tr-TR'))
      .filter(Boolean);

    for (const kelime of karaliste) {
      if (kelime.includes(' ')) {
        kaliplar.push(kelime);
      } else {
        tekilKelimeler.add(kelime);
      }
    }
    console.log(`[KARALİSTE] ${karaliste.length} kelime yüklendi (${tekilKelimeler.size} tekil, ${kaliplar.length} kalıp).`);
  }
} catch (err) {
  console.warn('[KARALİSTE] karaliste.txt okunamadı:', err.message);
}

// ─── Reklam Regex ─────────────────────────────────────────
// discord.gg, discord.com/invite, discordapp.com/invite, dsc.gg ve boşluk/nokta hileleri
const reklamRegex = /(discord\s*\.\s*gg|discord(app)?\s*\.\s*com\s*\/\s*invite|dsc\s*\.\s*gg)\s*\/\s*[a-zA-Z0-9-]+/i;

// ─── İhlal Geçmişi (otomatik susturma için) ───────────────
// `${guildId}-${userId}` → [zaman damgaları]
const ihlalGecmisi = new Map();
const IHLAL_ARALIK = 60_000;  // 1 dakika içinde
const IHLAL_SINIRI = 3;       // 3 ihlal → otomatik timeout
const OTOMATIK_MUTE_MS = 5 * 60_000;

/**
 * İhlali kaydeder; sınır aşıldıysa true döner (çağıran timeout uygular).
 */
function ihlalKaydet(guildId, userId) {
  const anahtar = `${guildId}-${userId}`;
  const simdi = Date.now();
  const liste = (ihlalGecmisi.get(anahtar) || []).filter(t => simdi - t < IHLAL_ARALIK);
  liste.push(simdi);
  if (liste.length >= IHLAL_SINIRI) {
    ihlalGecmisi.delete(anahtar);
    return true;
  }
  ihlalGecmisi.set(anahtar, liste);
  return false;
}

// RAM koruması: eski kayıtları temizle
setInterval(() => {
  const simdi = Date.now();
  for (const [k, liste] of ihlalGecmisi) {
    if (!liste.length || simdi - liste[liste.length - 1] > IHLAL_ARALIK) ihlalGecmisi.delete(k);
  }
}, 5 * 60_000).unref();

/**
 * Metni Türkçe karakterlere, leetspeak ve uzatmalara karşı normalize eder.
 */
function metniNormalizeEt(metin) {
  if (!metin || typeof metin !== 'string') return '';
  return metin
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR')
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/\$/g, 's')
    .replace(/3/g, 'e')
    // 3 ve daha fazla tekrarlanan harfleri teke indir (örn: siiiik -> sik)
    .replace(/(.)\1{2,}/gu, '$1');
}

/**
 * Mesaj içeriğinde yasaklı kelime olup olmadığını token bazlı ve kelime sınırları ile kontrol eder.
 */
function yasakliKelimeVarMi(metin) {
  if (!metin || typeof metin !== 'string') return false;

  const normalize = metniNormalizeEt(metin);
  if (!normalize) return false;

  // 1. Çok kelimeli kalıpları kelime sınırlarıyla kontrol et
  for (const kalip of kaliplar) {
    const escaped = kalip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9çğıöşüə])${escaped}([^a-z0-9çğıöşüə]|$)`, 'u');
    if (regex.test(normalize)) return true;
  }

  // 2. Mesajı sözcüklere (tokenlara) ayırarak kontrol et (tam kelime eşleşmesi)
  const tokenlar = normalize.split(/[^a-z0-9çğıöşüə]+/u).filter(Boolean);
  for (const token of tokenlar) {
    if (tekilKelimeler.has(token)) return true;
    // Çift harf bypass kontrolü (örn: piirno -> pirno, puurna -> purna)
    const tekeIndir = token.replace(/(.)\1+/gu, '$1');
    if (tekilKelimeler.has(tekeIndir)) return true;
  }

  // 3. Noktalı/boşluklu bypass kontrolü (örn: o.ç -> oc / oç, s i k -> sik, p.i.r.n.o -> pirno)
  const birlesik = normalize.replace(/[^a-z0-9çğıöşüə]/gu, '');
  if (birlesik.length >= 2 && birlesik.length <= 20) {
    if (tekilKelimeler.has(birlesik)) return true;
    const birlesikTekeIndir = birlesik.replace(/(.)\1+/gu, '$1');
    if (tekilKelimeler.has(birlesikTekeIndir)) return true;
  }

  return false;
}

/**
 * Mesajı spam/caps/karaliste/reklam açısından kontrol eder.
 * @param {Message} mesaj
 * @param {Object} [ayarlar]
 * @returns {null | 'spam' | 'caps' | 'karaliste' | 'reklam'}
 */
function mesajKontrol(mesaj, ayarlar = null, secenekler = {}) {
  const { spamSay = true } = secenekler;
  const icerik = mesaj.content;
  if (!icerik) return null;

  // ── Karaliste Kontrolü (Ayar açıksa veya belirtilmemişse varsayılan aktif) ──
  if (!ayarlar || ayarlar.karalisteMod !== false) {
    if (yasakliKelimeVarMi(icerik)) return 'karaliste';
  }

  // ── Reklam Linki ──
  if (reklamRegex.test(icerik)) return 'reklam';

  // ── Anti-Caps (Ayar açıksa) ──
  if (!ayarlar || ayarlar.antiCapsAktif !== false) {
    // Caps Lock (%70+)
    const harfler = icerik.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
    if (harfler.length >= 8) {
      const buyukHarfler = harfler.replace(/[^A-ZĞÜŞİÖÇ]/g, '');
      const oran = buyukHarfler.length / harfler.length;
      if (oran >= SPAM.CAPS_YUZDE / 100) return 'caps';
    }
  }

  // ── Anti-Spam (Ayar açıksa) ──
  // Düzenlenen mesajlar flood sayılmaz (spamSay=false)
  if (spamSay && (!ayarlar || ayarlar.antiSpamAktif !== false)) {
    // Spam / Flood
    const veri = spamKayit(mesaj.author.id);
    if (veri.mesajlar.length >= SPAM.MESAJ_SINIRI) return 'spam';
  }

  return null;
}

/**
 * İhlal türüne göre Türkçe uyarı metni döner.
 */
function ihlalMetni(tur) {
  const metinler = {
    spam     : '🚫 **Spam/Flood tespit edildi!** Lütfen mesajlarınızı yavaşlatın.',
    caps     : '🔤 **Aşırı büyük harf kullanımı!** Lütfen normal yazın.',
    karaliste: '🤬 **Yasaklı kelime kullandınız!** Bu mesaj kaldırıldı.',
    reklam   : '📢 **Reklam bağlantısı tespit edildi!** Sunucu davet linkleri yasaktır.',
  };
  return metinler[tur] || '⚠️ Mesajınız kaldırıldı.';
}

module.exports = {
  mesajKontrol,
  ihlalMetni,
  ihlalKaydet,
  OTOMATIK_MUTE_MS,
  karaliste,
  yasakliKelimeVarMi,
  metniNormalizeEt,
};
