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

/**
 * Gemini AI ile kullanıcı mesajını yanıtlar.
 * @param {Message} mesaj - Discord mesaj nesnesi
 * @param {string} icerik - Kullanıcının ilettiği metin
 */
async function geminiYanit(mesaj, icerik) {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

  if (!apiKey) {
    return mesaj.reply('❌ Gemini API anahtarı (.env) ayarlanmamış.');
  }

  const promptMetni = icerik ? icerik.trim() : '';
  if (!promptMetni) {
    return mesaj.reply('👋 Efendim? Benimle konuşmak için mesajınıza bir şeyler yazabilirsiniz!');
  }

  try {
    await mesaj.channel.sendTyping().catch(() => {});

    const genAI = new GoogleGenerativeAI(apiKey);

    const guildId = mesaj.guild?.id;
    const ayarlar = guildId ? ayarGetir(guildId) : null;
    const ozelTalimat = ayarlar?.aiOzelPrompt ? `\nSunucu Özel Talimatı: ${ayarlar.aiOzelPrompt}` : '';

    const sistemTalimati =
      `Senin adın VirBot v6. Sen ultra gelişmiş, Türkçe ve gerektiğinde Azerbaycan dilinde akıcı konuşan, ` +
      `VirDormit tarafından büyük bir titizlikle geliştirilmiş, son derece zeki, samimi, esprili ve yardımsever bir Discord asistanısın. ` +
      `Kullanıcı seninle sohbet ediyor. Çok uzun ve sıkıcı paragraflar yerine net, eğlenceli, dinamik, ` +
      `Discord formatına (kalın, liste, emoji) uygun canlı cevaplar ver. Botun ana prefixi "v!" dir ve slash (/) komutlarını da destekler. ` +
      `VirDormit'in eseri olduğunu gerektiğinde gururla belirt.${ozelTalimat}`;

    const tamPrompt = `${sistemTalimati}\n\nKullanıcı (${mesaj.author.displayName || mesaj.author.username}): "${promptMetni}"\nVirBot v6:`;

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
          break;
        }
      } catch (err) {
        sonHata = err;
        // Sonraki Flash / Flash-Lite modeline geç
      }
    }

    if (yanitMetni) {
      if (yanitMetni.length > 2000) {
        const parcalar = yanitMetni.match(/[\s\S]{1,1950}/g) || [];
        for (const parca of parcalar) {
          await mesaj.reply(parca).catch(() => {});
        }
      } else {
        await mesaj.reply(yanitMetni);
      }
    } else {
      console.error('[GEMİNİ v6] Tüm Flash modeller tükendi. Son hata:', sonHata?.message);
      await mesaj.reply('⚠️ Üzgünüm, şu anda yanıt oluşturamadım. Lütfen birkaç saniye sonra tekrar deneyin.');
    }
  } catch (genelHata) {
    console.error('[GEMİNİ v6 GENEL HATA]', genelHata);
    await mesaj.reply('❌ Yapay zeka ile iletişim kurulurken bir sorun meydana geldi.');
  }
}

module.exports = { geminiYanit, MODELLER };
