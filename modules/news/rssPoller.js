// ==========================================
//  VirBot — RSS Poller
//  Haber akışlarını kontrol eder ve yayınlar
// ==========================================
'use strict';

const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { RENKLER, RSS_ARALIK, VARSAYILAN_RSS } = require('../../config/config');
const {
  rssGetir,
  rssEkleDB,
  rssKaydetDB,
  rssleriYukle,
} = require('../data/dataManager');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8',
  },
  timeout: 10000,
});

// ─── RSS Başlat ────────────────────────────────────────────
async function rssBaslat(client) {
  try {
    await rssleriYukle();
    console.log('[RSS] Poller başlatıldı.');
    // İlk kontrolü hemen yap
    rssKontrolEt(client);
    // Belirlenen aralıkta döngüyü sürdür
    setInterval(() => rssKontrolEt(client), RSS_ARALIK || 10 * 60 * 1000);
  } catch (err) {
    console.error('[RSS] Başlatma hatası:', err.message);
  }
}

// ─── Tüm Kaynakları Kontrol Et ─────────────────────────────
async function rssKontrolEt(client) {
  const tumVeri = rssGetir();
  if (!tumVeri || typeof tumVeri !== 'object') return;

  for (const [guildId, kaynaklar] of Object.entries(tumVeri)) {
    if (!Array.isArray(kaynaklar) || kaynaklar.length === 0) continue;
    let veriDegisti = false;

    for (const kaynak of kaynaklar) {
      const guncellendi = await kaynakKontrolEt(client, guildId, kaynak);
      if (guncellendi) veriDegisti = true;
    }

    if (veriDegisti) {
      await rssKaydetDB(guildId, kaynaklar);
    }
  }
}

// ─── Tek Kaynağı Kontrol Et ────────────────────────────────
async function kaynakKontrolEt(client, guildId, kaynak) {
  try {
    if (!kaynak || !kaynak.url || !kaynak.kanalId) return false;

    const kanal = await client.channels.fetch(kaynak.kanalId).catch(() => null);
    if (!kanal) return false;

    const feed = await parser.parseURL(kaynak.url);
    if (!feed || !Array.isArray(feed.items) || feed.items.length === 0) return false;

    if (!Array.isArray(kaynak.gonderilen)) {
      kaynak.gonderilen = [];
    }

    // İlk kurulumda kanala 50 haber birden atıp spam yapmasın:
    // Eğer gonderilen boşsa (yeni eklenmişse), en son haberi al veya mevcutları işaretle
    if (kaynak.gonderilen.length === 0) {
      const sonHaberler = feed.items.slice(0, 3).reverse();
      for (const item of sonHaberler) {
        const id = item.guid || item.link || item.title;
        kaynak.gonderilen.push(id);
        await haberGonder(kanal, item, feed.title || kaynak.url);
        await new Promise(r => setTimeout(r, 1000));
      }
      return true;
    }

    // Normal akış: gönderilmemiş yeni haberleri bul
    const yeniItems = feed.items.slice(0, 5).filter(item => {
      const id = item.guid || item.link || item.title;
      return !kaynak.gonderilen.includes(id);
    }).reverse();

    if (yeniItems.length === 0) return false;

    for (const item of yeniItems) {
      const id = item.guid || item.link || item.title;
      await haberGonder(kanal, item, feed.title || kaynak.url);
      kaynak.gonderilen.push(id);
      await new Promise(r => setTimeout(r, 1200));
    }

    kaynak.gonderilen = kaynak.gonderilen.slice(-100);
    return true;
  } catch (hata) {
    console.warn(`[RSS] ${kaynak?.url} kontrol hatası:`, hata.message);
    return false;
  }
}

// ─── Haber Embed'i Gönder ──────────────────────────────────
async function haberGonder(kanal, item, kaynakBaslik) {
  const aciklamaHam = item.contentSnippet || item.content || item.summary || '';
  const aciklama = aciklamaHam
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 350);

  const embed = new EmbedBuilder()
    .setTitle(item.title ? item.title.slice(0, 256) : 'Haber')
    .setURL(item.link || 'https://virbot.com')
    .setDescription(aciklama ? `${aciklama}...` : 'Haber detayları için bağlantıya tıklayın.')
    .setColor(RENKLER.HABER || 0xFF8C00)
    .setFooter({ text: kaynakBaslik.slice(0, 100) })
    .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date());

  if (item.enclosure?.url) {
    embed.setImage(item.enclosure.url);
  } else if (item['media:content']?.$.url) {
    embed.setImage(item['media:content'].$.url);
  }

  return await kanal.send({ embeds: [embed] }).catch(() => {});
}

// ─── RSS Ekle ──────────────────────────────────────────────
async function rssEkle(guildId, url, kanalId) {
  return await rssEkleDB(guildId, url, kanalId);
}

// ─── Haber Ekle (varsayılan DonanımHaber) ───────────────────
async function haberEkle(guildId, kanalId) {
  return await rssEkle(guildId, VARSAYILAN_RSS, kanalId);
}

module.exports = {
  rssBaslat,
  rssEkle,
  haberEkle,
  rssKontrolEt,
};
