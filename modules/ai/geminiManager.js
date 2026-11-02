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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return mesaj.reply('❌ **Gemini API anahtarı eksik!**\n> Sunucu yöneticisi `.env` dosyasına geçerli bir `GEMINI_API_KEY` eklemeli.\n> API anahtarı almak için: https://aistudio.google.com/app/apikey');
  }

  const promptMetni = icerik ? icerik.trim() : '';
  if (!promptMetni) {
    return mesaj.reply('👋 Efendim? Benimle konuşmak için mesajınıza bir şeyler yazabilirsiniz!');
  }

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

    const tamPrompt = `${sistemTalimati}\n\n💬 **Sohbet:**\nKullanıcı (${mesaj.author.displayName || mesaj.author.username}): "${promptMetni}"\n\nVirBot v6:`;

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
      // 2000 karakterden uzunsa bölümlere ayır
      if (yanitMetni.length > 2000) {
        const parcalar = yanitMetni.match(/[\s\S]{1,1950}/g) || [];
        for (const parca of parcalar) {
          await mesaj.reply(parca).catch(() => {});
        }
      } else {
        await mesaj.reply(yanitMetni);
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

module.exports = { geminiYanit, MODELLER };
