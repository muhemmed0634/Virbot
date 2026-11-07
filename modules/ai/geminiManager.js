// ==========================================
//  VirBot v6 — Gemini AI Yöneticisi
//  Yalnızca Gemini Flash ve Flash-Lite Modelleri
//  VirDormit Tarafından Geliştirilmiştir
// ==========================================
'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ayarGetir } = require('../data/dataManager');

// Yalnızca Gemini Flash ve Flash Lite modelleri (Optimizasyon & Yüksek Hız)
const MODELLER = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

// ─── Kullanıcı Bekleme Süresi (API kotasını korur) ─────────
const AI_COOLDOWN_MS = 4_000;
const aiCooldown = new Map(); // `${guildId}-${userId}` → zaman

// ─── Kanal Sohbet Hafızası ─────────────────────────────────
// Bot önceki mesajları hatırlar → bağlamlı sohbet. RAM için kısa tutulur.
const HAFIZA_MESAJ = 8;              // Kanal başına son 8 mesaj (4 soru-cevap)
const HAFIZA_OMRU_MS = 15 * 60_000;  // 15 dk sessizlikte unutulur
const sohbetHafizasi = new Map();    // kanalId → { mesajlar: [{kim, metin}], son }

function hafizaGetir(kanalId) {
  const h = sohbetHafizasi.get(kanalId);
  if (!h || Date.now() - h.son > HAFIZA_OMRU_MS) return [];
  return h.mesajlar;
}

function hafizayaEkle(kanalId, kim, metin) {
  const mesajlar = [...hafizaGetir(kanalId), { kim, metin: metin.slice(0, 600) }].slice(-HAFIZA_MESAJ);
  sohbetHafizasi.set(kanalId, { mesajlar, son: Date.now() });
}

/** Kanalın sohbet hafızasını sıfırlar ("unut" komutu için). */
function hafizaSifirla(kanalId) {
  sohbetHafizasi.delete(kanalId);
}

setInterval(() => {
  const simdi = Date.now();
  for (const [k, h] of sohbetHafizasi) if (simdi - h.son > HAFIZA_OMRU_MS) sohbetHafizasi.delete(k);
  for (const [k, t] of aiCooldown) if (simdi - t > AI_COOLDOWN_MS) aiCooldown.delete(k);
}, 5 * 60_000).unref();

/**
 * Gemini AI ile kullanıcı mesajını yanıtlar.
 * @param {Message} mesaj - Discord mesaj nesnesi
 * @param {string} icerik - Kullanıcının ilettiği metin
 */
async function geminiYanit(mesaj, icerik) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return mesaj.reply('❌ **Gemini API anahtarı eksik!**\n> Sunucu yöneticisi `.env` dosyasına geçerli bir `GEMINI_API_KEY` eklemeli.\n> API anahtarı almak için: https://aistudio.google.com/app/apikey');
  }

  const promptMetni = icerik ? icerik.trim().slice(0, 2000) : '';
  if (!promptMetni) {
    return mesaj.reply('👋 Efendim? Benimle konuşmak için mesajınıza bir şeyler yazabilirsiniz!');
  }

  // "unut" / "sıfırla" → sohbet hafızasını temizle
  if (/^(unut|sıfırla|sifirla|reset)$/i.test(promptMetni)) {
    hafizaSifirla(mesaj.channelId);
    return mesaj.reply('🧹 Bu kanaldaki sohbet hafızamı temizledim. Yeni bir konuya başlayabiliriz!');
  }

  // Kullanıcı başına bekleme süresi
  const cdAnahtar = `${mesaj.guild?.id}-${mesaj.author.id}`;
  const fark = Date.now() - (aiCooldown.get(cdAnahtar) || 0);
  if (fark < AI_COOLDOWN_MS) {
    await mesaj.react('⏳').catch(() => {});
    return;
  }
  aiCooldown.set(cdAnahtar, Date.now());

  try {
    await mesaj.channel.sendTyping().catch(() => {});

    const genAI = new GoogleGenerativeAI(apiKey.trim());

    const guildId = mesaj.guild?.id;
    const ayarlar = guildId ? ayarGetir(guildId) : null;
    const ozelTalimat = ayarlar?.aiOzelPrompt ? `\n\n🎨 Sunucu Özel Karakter Talimatı:\n${ayarlar.aiOzelPrompt}` : '';

    const sistemTalimati =
      `🤖 **Kimsin?**\n` +
      `Senin adın VirBot v6. Sen ultra gelişmiş, Türkçe ve gerektiğinde Azerbaycan dilinde akıcı konuşan, ` +
      `VirDormit tarafından büyük bir titizlikle geliştirilmiş, son derece zeki, samimi, esprili ve yardımsever bir Discord asistanısın.\n\n` +
      `🎯 **Görevin:**\n` +
      `Kullanıcılarla sohbet et, sorularını yanıtla, Discord kültürüne uygun samimi ve eğlenceli cevaplar ver. ` +
      `Çok uzun ve sıkıcı paragraflar yerine net, dinamik, Discord formatına (kalın **metin**, liste, emoji 😊) uygun canlı cevaplar ver.\n\n` +
      `⚙️ **Teknik Detaylar:**\n` +
      `- Ana prefix: \`v!\`\n` +
      `- Slash (/) komutlarını da desteklersin\n` +
      `- VirDormit'in eseri olduğunu gerektiğinde gururla belirt\n` +
      `- Gemini Flash ve Flash-Lite modelleriyle çalışıyorsun (hızlı ve optimize)${ozelTalimat}`;

    const kullaniciAdi = mesaj.member?.displayName || mesaj.author.displayName || mesaj.author.username;
    const gecmis = hafizaGetir(mesaj.channelId)
      .map(m => `${m.kim}: ${m.metin}`)
      .join('\n');

    const tamPrompt =
      `${sistemTalimati}\n\n` +
      (gecmis ? `📜 **Önceki Konuşma (bağlam için):**\n${gecmis}\n\n` : '') +
      `💬 **Yeni Mesaj:**\n${kullaniciAdi}: "${promptMetni}"\n\nVirBot v6:`;

    let yanitMetni = null;
    let sonHata = null;

    // Yalnızca Flash ve Flash-Lite modelleri sırayla denenir
    for (const modelAdi of MODELLER) {
      try {
        const model = genAI.getGenerativeModel({ model: modelAdi });
        const result = await model.generateContent(tamPrompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          yanitMetni = text.trim();
          console.log(`[GEMİNİ v6] ✅ ${modelAdi} ile yanıt oluşturuldu (${text.length} karakter)`);
          break;
        }
      } catch (err) {
        sonHata = err;
        console.warn(`[GEMİNİ v6] ⚠️ ${modelAdi} başarısız, sonraki modele geçiliyor...`);
        // Sonraki Flash / Flash-Lite modeline geç
      }
    }

    if (yanitMetni) {
      hafizayaEkle(mesaj.channelId, kullaniciAdi, promptMetni);
      hafizayaEkle(mesaj.channelId, 'VirBot v6', yanitMetni);

      // @everyone / @here / rol etiketleriyle kimseyi rahatsız etme
      const guvenliYanit = (metin) => ({ content: metin, allowedMentions: { parse: [], repliedUser: true } });

      // 2000 karakterden uzunsa bölümlere ayır
      if (yanitMetni.length > 2000) {
        const parcalar = yanitMetni.match(/[\s\S]{1,1950}/g) || [];
        for (const parca of parcalar) {
          await mesaj.reply(guvenliYanit(parca)).catch(() => {});
        }
      } else {
        await mesaj.reply(guvenliYanit(yanitMetni));
      }
    } else {
      console.error('[GEMİNİ v6] ❌ Tüm Flash modeller tükendi. Son hata:', sonHata?.message || 'Bilinmeyen hata');
      await mesaj.reply('⚠️ **Üzgünüm, şu anda yanıt oluşturamadım.**\n> Lütfen birkaç saniye sonra tekrar deneyin veya yöneticiye haber verin.');
    }
  } catch (genelHata) {
    console.error('[GEMİNİ v6 GENEL HATA]', genelHata);
    
    let hataMesaji = '❌ **Yapay zeka ile iletişim kurulurken bir sorun meydana geldi.**\n';
    
    if (genelHata.message?.includes('API_KEY_INVALID') || genelHata.message?.includes('401')) {
      hataMesaji += '> Hata: API anahtarı geçersiz! Sunucu yöneticisi `.env` dosyasındaki `GEMINI_API_KEY` değerini kontrol etmelidir.';
    } else if (genelHata.message?.includes('quota') || genelHata.message?.includes('429')) {
      hataMesaji += '> Hata: API kullanım limiti aşıldı! Lütfen daha sonra tekrar deneyin.';
    } else {
      hataMesaji += `> Detay: \`${genelHata.message || 'Bilinmeyen hata'}\``;
    }
    
    await mesaj.reply(hataMesaji);
  }
}

module.exports = { geminiYanit, hafizaSifirla, MODELLER };
