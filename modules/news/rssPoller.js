// ==========================================
//  VirBot — RSS Poller
//  Her 10 dakikada bir RSS akışlarını kontrol eder
// ==========================================

const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { RENKLER, RSS_ARALIK, VARSAYILAN_RSS } = require('../../config/config');
const { rssGetir, rssKaydet } = require('../data/dataManager');

const parser = new Parser();

// ─── RSS Başlat ────────────────────────────────────────────
function rssBaslat(client) {
  console.log('[RSS] Poller başlatıldı.');
  rssKontrolEt(client);
  setInterval(() => rssKontrolEt(client), RSS_ARALIK);
}

// ─── Tüm Kaynakları Kontrol Et ─────────────────────────────
async function rssKontrolEt(client) {
  const veri = rssGetir();

  for (const guildId of Object.keys(veri)) {
    const kaynaklar = veri[guildId];
    for (const kaynak of kaynaklar) {
      await kaynakKontrolEt(client, guildId, kaynak, veri);
    }
  }
}

// ─── Tek Kaynağı Kontrol Et ────────────────────────────────
async function kaynakKontrolEt(client, guildId, kaynak, veri) {
  try {
    const feed = await parser.parseURL(kaynak.url);
    const kanal = await client.channels.fetch(kaynak.kanalId).catch(() => null);
    if (!kanal) return;

    const gonderiminGörüldükleri = kaynak.gonderilen || [];
    let degistiMi = false;

    for (const item of feed.items.slice(0, 5)) {
      const itemId = item.guid || item.link || item.title;
      if (gonderiminGörüldükleri.includes(itemId)) continue;

      const embed = new EmbedBuilder()
        .setTitle(item.title?.slice(0, 256) || 'Başlıksız Haber')
        .setURL(item.link || '')
        .setDescription(
          (item.contentSnippet || item.content || item.summary || '')
            .replace(/<[^>]*>/g, '')
            .slice(0, 300) + '...' || 'İçerik bulunamadı.'
        )
        .setColor(RENKLER.HABER)
        .setTimestamp(item.pubDate ? new Date(item.pubDate) : undefined)
        .setFooter({ text: feed.title || kaynak.url });

      if (item.enclosure?.url) embed.setImage(item.enclosure.url);
      else if (item['media:content']?.$.url) embed.setImage(item['media:content'].$.url);

      await kanal.send({ embeds: [embed] }).catch(console.error);
      gonderiminGörüldükleri.push(itemId);
      degistiMi = true;

      // Rate limit
      await new Promise(r => setTimeout(r, 1500));
    }

    if (degistiMi) {
      kaynak.gonderilen = gonderiminGörüldükleri.slice(-100); // Max 100 ID tut
      rssKaydet(veri);
    }
  } catch (hata) {
    console.error(`[RSS] ${kaynak.url} kontrol hatası:`, hata.message);
  }
}

// ─── RSS Ekle ──────────────────────────────────────────────
function rssEkle(guildId, url, kanalId) {
  const veri = rssGetir();
  if (!veri[guildId]) veri[guildId] = [];

  const mevcutMu = veri[guildId].some(k => k.url === url && k.kanalId === kanalId);
  if (mevcutMu) return false;

  veri[guildId].push({ url, kanalId, gonderilen: [] });
  rssKaydet(veri);
  return true;
}

// ─── Haber Ekle (varsayılan) ───────────────────────────────
function haberEkle(guildId, kanalId) {
  return rssEkle(guildId, VARSAYILAN_RSS, kanalId);
}

module.exports = { rssBaslat, rssEkle, haberEkle };
