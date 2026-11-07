// ==========================================
//  VirBot v6 — RPG Yöneticisi
//  Hunt, Zoo, Sell, Equip, Market, Give, Daily
//  (Slots / Coinflip / Blackjack kendi komut dosyalarında, atomik)
// ==========================================
'use strict';

const { RPG } = require('../../config/config');
const { kullaniciGetir, coinDegistir } = require('../data/dataManager');
const User = require('../../database/models/User');

const GUN_MS = 86_400_000;
// Türkiye sabit UTC+3 (2016'dan beri yaz saati yok). Sunucu (Render) UTC çalışsa da
// günlük ödül Türkiye saatiyle gece yarısında sıfırlanır.
const TR_OFFSET_MS = 3 * 3_600_000;

function trGunBaslangici(ts = Date.now()) {
  return Math.floor((ts + TR_OFFSET_MS) / GUN_MS) * GUN_MS - TR_OFFSET_MS;
}

// ─── EKİPMAN / MARKET HAVUZU (Min. 500 Coin) ───────────────
const SILAHLAR = [
  { id: 'pasli_kilic', isim: '🗡️ Pas Kılıç', guc: 10, fiyat: 500, tip: 'silah' },
  { id: 'demir_kilic', isim: '⚔️ Demir Kılıç', guc: 25, fiyat: 1000, tip: 'silah' },
  { id: 'sihirli_yay', isim: '🏹 Sihirli Yay', guc: 50, fiyat: 2500, tip: 'silah' },
  { id: 'ejder_mizragi', isim: '🔱 Ejder Mızrağı', guc: 90, fiyat: 5000, tip: 'silah' },
  { id: 'simsek_kilici', isim: '⚡ Şimşek Kılıcı', guc: 150, fiyat: 10000, tip: 'silah' },
];

const ZIRHLAR = [
  { id: 'deri_zirh', isim: '🛡️ Deri Zırh', guc: 10, fiyat: 500, tip: 'zirh' },
  { id: 'zincir_zirh', isim: '⚙️ Zincir Zırh', guc: 25, fiyat: 1000, tip: 'zirh' },
  { id: 'celik_zirh', isim: '🪖 Çelik Zırh', guc: 50, fiyat: 2500, tip: 'zirh' },
  { id: 'kristal_zirh', isim: '👑 Kristal Zırh', guc: 90, fiyat: 5000, tip: 'zirh' },
  { id: 'golge_zirh', isim: '🌑 Gölge Zırh', guc: 150, fiyat: 10000, tip: 'zirh' },
];

const MAKS_GUC = 300; // En iyi silah + en iyi zırh

// ─── Yardımcılar ───────────────────────────────────────────
/** Kullanıcının toplam ekipman gücü (silah + zırh). */
function ekipmanGucu(kullanici) {
  return (kullanici?.silah?.guc || 0) + (kullanici?.zirh?.guc || 0);
}

/**
 * Ekipman gücüne göre av bonusları.
 * - oran: 0..1 (nadir hayvan ağırlıklarını artırır)
 * - coinCarpan: av kazancı çarpanı (maks x2)
 */
function avBonusu(guc) {
  const oran = Math.min(Math.max(guc, 0), MAKS_GUC) / MAKS_GUC;
  return { oran, coinCarpan: 1 + oran };
}

// Tam ekipmanda nadirlik ağırlık çarpanları (dengeli: efsanevi %2 → ~%4)
const NADIR_CARPAN = { COMMON: -0.3, UNCOMMON: 0.2, RARE: 0.5, EPIC: 0.8, LEGENDARY: 1.0 };

/**
 * Rastgele hayvan seçer. `oran` (0..1) arttıkça nadir hayvan şansı artar.
 */
function rastgeleHayvan(oran = 0) {
  const agirliklar = Object.entries(RPG.HAYVAN_SANSLARI)
    .map(([nadir, sans]) => [nadir, sans * (1 + (NADIR_CARPAN[nadir] || 0) * oran)]);
  const toplamAgirlik = agirliklar.reduce((t, [, a]) => t + a, 0);

  let sayi = Math.random() * toplamAgirlik;
  let secilen = 'COMMON';
  for (const [nadir, agirlik] of agirliklar) {
    sayi -= agirlik;
    if (sayi <= 0) { secilen = nadir; break; }
  }

  const liste = RPG.HAYVANLAR[secilen];
  return {
    isim : liste[Math.floor(Math.random() * liste.length)],
    nadir: secilen,
    bonus: RPG.HAYVAN_BONUS[secilen],
  };
}

function nadirRenk(nadir) {
  const renkler = {
    COMMON   : 0xAAAAAA,
    UNCOMMON : 0x57F287,
    RARE     : 0x00B0F4,
    EPIC     : 0xA259FF,
    LEGENDARY: 0xFFAA00,
  };
  return renkler[nadir] || 0xAAAAAA;
}

function nadirYildiz(nadir) {
  return { COMMON: '⚪', UNCOMMON: '🟢', RARE: '🔵', EPIC: '🟣', LEGENDARY: '🟡' }[nadir] || '⚪';
}

/** Bir hayvanın satış değeri. */
function hayvanDegeri(hayvan) {
  return (RPG.HAYVAN_BONUS[hayvan.nadir] || 1) * 5;
}

// ─── HUNT ──────────────────────────────────────────────────
const HUNT_COOLDOWN = 30_000;
const ZOO_LIMIT = 200; // Belge şişmesin (MongoDB 16MB sınırı / RAM)

async function hunt(userId, guildId) {
  const kullanici = await kullaniciGetir(userId, guildId);
  const simdi = Date.now();

  if (kullanici.huntCooldown && simdi - kullanici.huntCooldown < HUNT_COOLDOWN) {
    const kalan = Math.ceil((HUNT_COOLDOWN - (simdi - kullanici.huntCooldown)) / 1000);
    return { hata: `⏳ Avlanmaya devam etmeden önce **${kalan} saniye** beklemelisiniz.` };
  }
  if ((kullanici.zoo?.length || 0) >= ZOO_LIMIT) {
    return { hata: `🦁 Hayvanat bahçen dolu (**${ZOO_LIMIT}** hayvan)! Önce \`v!sell hepsi\` ile satış yap.` };
  }

  // Ekipman artık işe yarıyor: güç arttıkça nadir hayvan şansı ve coin kazancı artar
  const guc = ekipmanGucu(kullanici);
  const bonus = avBonusu(guc);
  const hayvan = rastgeleHayvan(bonus.oran);
  const temelKazanc = Math.floor(Math.random() * 30) + 10 + hayvan.bonus * 2;
  const coinKazanc = Math.floor(temelKazanc * bonus.coinCarpan);

  // Atomik güncelleme: cooldown koşulu filtrede → aynı anda gelen iki komut çift ödül alamaz
  const guncel = await User.findOneAndUpdate(
    {
      userId, guildId,
      $or: [{ huntCooldown: { $lte: simdi - HUNT_COOLDOWN } }, { huntCooldown: null }],
    },
    {
      $set: { huntCooldown: simdi },
      $inc: { coins: coinKazanc },
      $push: { zoo: hayvan },
    },
    { new: true }
  );
  if (!guncel) return { hata: '⏳ Avlanmaya devam etmeden önce biraz beklemelisiniz.' };

  return {
    hayvan,
    coinKazanc,
    ekipmanBonusu: coinKazanc - temelKazanc,
    guc,
    toplamZoo: guncel.zoo.length,
  };
}

// ─── MARKET SATIN ALMA ─────────────────────────────────────
async function esyaSatinAl(userId, guildId, esyaId) {
  const aranan = String(esyaId || '').toLowerCase();
  const tumEsyalar = [...SILAHLAR, ...ZIRHLAR];
  const esya = tumEsyalar.find(e => e.id === aranan) ||
               tumEsyalar.find(e => e.isim.toLowerCase().includes(aranan));

  if (!esya || !aranan) {
    return { hata: '❌ Böyle bir eşya bulunamadı! Mevcut eşyaları görmek için `/market` yazın.' };
  }

  // Aynı veya daha güçlü eşyası varsa boşuna para harcamasın
  const kullanici = await kullaniciGetir(userId, guildId);
  const mevcut = kullanici[esya.tip];
  if (mevcut && mevcut.guc >= esya.guc) {
    return { hata: `⚠️ Zaten **${mevcut.isim}** (+${mevcut.guc}) kuşanmışsın. Daha güçlü bir ${esya.tip === 'silah' ? 'silah' : 'zırh'} seç.` };
  }

  const ekipman = { [esya.tip]: { isim: esya.isim, guc: esya.guc } };

  // Atomik: bakiye yeterliyse düş ve eşyayı ver
  const guncel = await coinDegistir(userId, guildId, -esya.fiyat, ekipman);
  if (!guncel) {
    return { hata: `❌ Yetersiz bakiye! Bu eşyanın fiyatı **${esya.fiyat} 🪙**, senin bakiyen: **${kullanici.coins} 🪙**.` };
  }

  return { basarili: true, esya, kalanCoin: guncel.coins };
}

// ─── ZOO ───────────────────────────────────────────────────
async function zoo(userId, guildId) {
  const kullanici = await kullaniciGetir(userId, guildId);
  return {
    zoo   : kullanici.zoo || [],
    coins : kullanici.coins,
    silah : kullanici.silah,
    zirh  : kullanici.zirh,
    guc   : ekipmanGucu(kullanici),
  };
}

// ─── SELL ──────────────────────────────────────────────────
async function sell(userId, guildId, hedef) {
  const kullanici = await kullaniciGetir(userId, guildId);
  if (!kullanici.zoo || kullanici.zoo.length === 0) {
    return { hata: '🦁 Hayvanat bahçeniz boş! Önce `/hunt` ile hayvan avlayın.' };
  }

  // İyimser kilit: belge okunduktan sonra değiştiyse (eşzamanlı satış) işlem iptal edilir
  const kilit = { userId, guildId, updatedAt: kullanici.updatedAt };
  const catismaHatasi = { hata: '⚠️ Envanteriniz aynı anda değişti, lütfen tekrar deneyin.' };

  if (hedef === 'hepsi' || hedef === 'all') {
    const kazanc = kullanici.zoo.reduce((acc, h) => acc + hayvanDegeri(h), 0);
    const satilan = kullanici.zoo.length;
    const sonuc = await User.findOneAndUpdate(kilit, { $set: { zoo: [] }, $inc: { coins: kazanc } }, { new: true });
    if (!sonuc) return catismaHatasi;
    return { satilan, kazanc, yeniBakiye: sonuc.coins };
  }

  // Nadirlik ile toplu satış: "v!sell common", "v!sell rare" ...
  const nadirlik = hedef.toUpperCase();
  if (RPG.HAYVAN_BONUS[nadirlik] !== undefined) {
    const satilacak = kullanici.zoo.filter(h => h.nadir === nadirlik);
    if (satilacak.length === 0) return { hata: `❌ Hiç **${nadirlik}** hayvanın yok.` };
    const kazanc = satilacak.reduce((acc, h) => acc + hayvanDegeri(h), 0);
    const yeniZoo = kullanici.zoo.filter(h => h.nadir !== nadirlik);
    const sonuc = await User.findOneAndUpdate(kilit, { $set: { zoo: yeniZoo }, $inc: { coins: kazanc } }, { new: true });
    if (!sonuc) return catismaHatasi;
    return { satilan: satilacak.length, kazanc, nadirlik, yeniBakiye: sonuc.coins };
  }

  const indeks = parseInt(hedef, 10) - 1;
  if (isNaN(indeks) || indeks < 0 || indeks >= kullanici.zoo.length) {
    return { hata: '❌ Geçersiz hayvan numarası. `/zoo` ile listeni gör. (Ya da: `hepsi`, `common`, `rare`...)' };
  }
  const hayvan = kullanici.zoo[indeks];
  const kazanc = hayvanDegeri(hayvan);
  const yeniZoo = kullanici.zoo.filter((_, i) => i !== indeks);
  const sonuc = await User.findOneAndUpdate(kilit, { $set: { zoo: yeniZoo }, $inc: { coins: kazanc } }, { new: true });
  if (!sonuc) return catismaHatasi;
  return { satilan: 1, kazanc, hayvanAdi: hayvan.isim, yeniBakiye: sonuc.coins };
}

// ─── EQUIP ─────────────────────────────────────────────────
async function equip(userId, guildId, tip) {
  const kullanici = await kullaniciGetir(userId, guildId);
  if (tip === 'silah') {
    if (!kullanici.silah) return { hata: '❌ Envanterinizde silah bulunmuyor. `/market` üzerinden satın alabilirsiniz.' };
    return { ekipman: kullanici.silah, tip: 'Silah', toplamGuc: ekipmanGucu(kullanici) };
  } else if (tip === 'zirh') {
    if (!kullanici.zirh) return { hata: '❌ Envanterinizde zırh bulunmuyor. `/market` üzerinden satın alabilirsiniz.' };
    return { ekipman: kullanici.zirh, tip: 'Zırh', toplamGuc: ekipmanGucu(kullanici) };
  }
  return { hata: '❌ Geçersiz ekipman tipi. `silah` veya `zirh` yazın.' };
}

// ─── GIVE ──────────────────────────────────────────────────
async function give(gonderenId, hedefId, guildId, miktar) {
  if (!Number.isInteger(miktar) || miktar <= 0) return { hata: '❌ Sıfır, negatif veya geçersiz coin transfer edilemez.' };
  // Kendine gönderim coin çoğaltma açığıydı (iki ayrı okuma/yazma)
  if (gonderenId === hedefId) return { hata: '❌ Kendine para gönderemezsin.' };

  // Atomik: önce gönderenden düş (bakiye yetersizse null), sonra alıcıya ekle
  const gonderen = await coinDegistir(gonderenId, guildId, -miktar);
  if (!gonderen) {
    const g = await kullaniciGetir(gonderenId, guildId);
    return { hata: `❌ Yeterli coininiz yok. Bakiye: **${g.coins} 🪙**` };
  }
  const alici = await coinDegistir(hedefId, guildId, miktar);
  if (!alici) {
    // Alıcıya eklenemediyse parayı iade et (coin buharlaşmasın)
    await coinDegistir(gonderenId, guildId, miktar);
    return { hata: '❌ Transfer sırasında bir hata oluştu, coinleriniz iade edildi.' };
  }

  return { miktar, gonderenCoin: gonderen.coins, hedefCoin: alici.coins };
}

// ─── DAILY ─────────────────────────────────────────────────
// Türkiye saatiyle gece yarısı sıfırlanır. Üst üste alınırsa seri bonusu (maks 7 gün → +%70).
const SERI_MAKS = 7;
const SERI_BONUS = 0.10;

async function daily(userId, guildId) {
  const kullanici = await kullaniciGetir(userId, guildId);
  const bugunBaslangic = trGunBaslangici();

  if (kullanici.dailySon && kullanici.dailySon >= bugunBaslangic) {
    const kalanMs = bugunBaslangic + GUN_MS - Date.now();
    const saat = Math.floor(kalanMs / 3_600_000);
    const dakika = Math.ceil((kalanMs % 3_600_000) / 60_000);
    return { hata: `⏳ Günlük ödülünüzü zaten aldınız! **${saat} saat ${dakika} dakika** sonra (gece yarısı) tekrar deneyin.` };
  }

  // Dün de aldıysa seri devam eder, yoksa 1'den başlar
  const dunAldi = kullanici.dailySon && kullanici.dailySon >= bugunBaslangic - GUN_MS;
  const seri = dunAldi ? (kullanici.dailySeri || 0) + 1 : 1;
  const carpan = 1 + Math.min(seri - 1, SERI_MAKS) * SERI_BONUS;
  const odul = Math.floor(RPG.DAILY_COIN * carpan);

  // Atomik: aynı gün içinde iki kez alınamaz (eşzamanlı komutlar dahil)
  const guncel = await coinDegistir(userId, guildId, odul, { dailySon: Date.now(), dailySeri: seri }, {
    $or: [{ dailySon: { $lt: bugunBaslangic } }, { dailySon: null }],
  });
  if (!guncel) return { hata: '⏳ Günlük ödülünüzü zaten aldınız!' };
  return { odul, seri, bonusYuzde: Math.round((carpan - 1) * 100), yeniMiktar: guncel.coins };
}

module.exports = {
  hunt, zoo, sell, equip, give, daily,
  esyaSatinAl, SILAHLAR, ZIRHLAR,
  nadirRenk, nadirYildiz, rastgeleHayvan, ekipmanGucu, hayvanDegeri, trGunBaslangici,
};
