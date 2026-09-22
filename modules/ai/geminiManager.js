// ==========================================
//  VirBot v2 — Gemini AI Yöneticisi
//  Akıllı, Doğal ve Hızlı Sohbet Sistemi
// ==========================================
'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Öncelikli ve yedek modeller
const MODELLER = [
  'gemini-3.6-flash',
  'gemini-2.5-pro',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
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

    const sistemTalimati =
      `Senin adın VirBot. Sen ultra gelişmiş, Türkçe ve gerektiğinde Azerbaycan dilinde konuşan, ` +
      `samimi, esprili, yardımsever bir Discord botusun. ` +
      `Kullanıcı seninle sohbet ediyor. Çok uzun ve sıkıcı paragraflar yerine net, eğlenceli, ` +
      `doğal ve Discord ortamına uygun samimi cevaplar ver. Botun prefixi "v!" dir.`;

    const tamPrompt = `${sistemTalimati}\n\nKullanıcı (${mesaj.author.displayName || mesaj.author.username}): "${promptMetni}"\nVirBot:`;

    let yanitMetni = null;
    let sonHata = null;

    // Modelleri sırayla dene (yüksek yük veya kota aşımı durumunda fallback)
    for (const modelAdi of MODELLER) {
      try {
        const model = genAI.getGenerativeModel({ model: modelAdi });
        const result = await model.generateContent(tamPrompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          yanitMetni = text.trim();
          break; // Başarılı, döngüden çık
        }
      } catch (err) {
        sonHata = err;
        console.warn(`[GEMINI AI] ${modelAdi} başarısız oldu, sonraki deneniyor:`, err.message);
      }
    }

    if (!yanitMetni) {
      console.error('[GEMINI AI] Tüm modeller başarısız oldu:', sonHata?.message);
      return mesaj.reply('❌ Yapay zeka şu an yoğunluk nedeniyle yanıt veremedi. Lütfen biraz sonra tekrar deneyin.').catch(() => {});
    }

    // 2000 karakter sınırını yönet
    if (yanitMetni.length <= 2000) {
      await mesaj.reply(yanitMetni).catch(() => {});
    } else {
      // 2000'den uzunsa parçalara bölerek gönder
      const parcalar = yanitMetni.match(/[\s\S]{1,1900}/g) || [];
      for (const parca of parcalar) {
        await mesaj.channel.send(parca).catch(() => {});
      }
    }
  } catch (genelHata) {
    console.error('[GEMINI AI GENEL HATA]:', genelHata);
    mesaj.reply('❌ Yapay zeka yanıt verirken bir hata oluştu.').catch(() => {});
  }
}

module.exports = { geminiYanit };
