// ==========================================
//  VirBot v2 — Gemini AI Yöneticisi
// ==========================================
'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function geminiYanit(mesaj, icerik) {
  if (!process.env.GEMINI_API_KEY) {
    return mesaj.reply('❌ Gemini API anahtarı ayarlanmamış.');
  }

  try {
    mesaj.channel.sendTyping();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Senin adın VirBot. Sen gelişmiş, Türkçe konuşan bir Discord botusun. ` +
      `Sana şu mesaj geldi: "${icerik}". Bu mesaja samimi ve zekice bir cevap ver.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      // Mesaj uzunluğu 2000'i geçerse parçala
      if (text.length > 2000) {
        await mesaj.reply(text.slice(0, 1997) + '...');
      } else {
        await mesaj.reply(text);
      }
    }
  } catch (hata) {
    console.error('[GEMINI AI]', hata.message);
    mesaj.reply('❌ Yapay zeka şu an cevap veremiyor.').catch(() => {});
  }
}

module.exports = { geminiYanit };
