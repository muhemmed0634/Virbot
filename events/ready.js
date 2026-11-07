// ==========================================
//  VirBot — Hazır Olayı
//  Slash Komut Kaydı, Çekiliş / Geçici Ban Yükleme, RSS
//  Her adım ayrı try/catch içinde: biri çökerse diğerleri yine çalışır
// ==========================================
'use strict';

const { ActivityType } = require('discord.js');
const { PREFIX } = require('../config/config');
const { rssBaslat } = require('../modules/news/rssPoller');
const { ayarlariYukle, tempVoiceYukle, kelimeOyunuYukle } = require('../modules/data/dataManager');
const { honeypotYukle } = require('../modules/security/honeypotManager');
const { aktifCekilisleriYukle } = require('../modules/giveaway/giveawayManager');
const { davetleriOnbellege } = require('../modules/utils/davetTakip');
const { geciciBanlariYukle } = require('../modules/mod/tempBanManager');

async function adim(ad, fn) {
  try {
    await fn();
  } catch (hata) {
    console.error(`[READY] ${ad} adımı başarısız:`, hata?.message || hata);
  }
}

module.exports = {
  isim: 'ready',
  birKere: true,

  async calistir(client) {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  ✅  VirBot v6 Çevrimiçi!            ║`);
    console.log(`║  🤖  ${client.user.tag.padEnd(34)}║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    // Durum: sunucu sayısı ve yardım komutu arasında döner
    const durumlar = [
      () => `${PREFIX}yardim | /yardim`,
      () => `${client.guilds.cache.size} sunucu | VirBot v6`,
      () => `${PREFIX}hunt ile ava çık 🏹`,
    ];
    let durumSira = 0;
    const durumGuncelle = () => {
      client.user.setPresence({
        activities: [{ name: durumlar[durumSira++ % durumlar.length](), type: ActivityType.Watching }],
        status: 'online',
      });
    };
    durumGuncelle();
    setInterval(durumGuncelle, 60_000).unref();

    // 1. Sunucu ayarları, honeypot ve kelime oyunu
    await adim('Ayar yükleme', async () => {
      let yuklenen = 0;
      for (const guildId of client.guilds.cache.keys()) {
        try {
          await ayarlariYukle(guildId);
          await honeypotYukle(guildId);
          kelimeOyunuYukle(guildId);
          yuklenen++;
        } catch (err) {
          console.error(`[DATA] ${guildId} ayarları yüklenemedi:`, err.message);
        }
      }
      console.log(`[DATA] ${yuklenen} sunucunun ayarları yüklendi.`);
    });

    await adim('Geçici ses', () => tempVoiceYukle());

    // 2. Aktif çekilişler ve geçici banlar (restart sonrası zamanlayıcılar yeniden kurulur)
    await adim('Çekiliş', () => aktifCekilisleriYukle(client));
    await adim('Geçici ban', () => geciciBanlariYukle(client));

    // 3. Slash (/) komutlarını Discord'a kaydet
    await adim('Slash kayıt', async () => {
      const slashListesi = [];
      const eklenen = new Set();
      for (const komut of (client.komutlar?.values() || [])) {
        if (!komut.slashData) continue;
        const json = komut.slashData.toJSON ? komut.slashData.toJSON() : komut.slashData;
        if (eklenen.has(json.name)) continue;
        eklenen.add(json.name);
        slashListesi.push(json);
      }
      if (slashListesi.length > 0) {
        await client.application.commands.set(slashListesi);
        console.log(`[SLASH] ✅ ${slashListesi.length} slash komut Discord API'ye başarıyla kaydedildi.`);
      }
    });

    // 4. Davet takibi önbelleği
    await adim('Davet önbelleği', async () => {
      client._oncekiDavetler = client._oncekiDavetler || new Map();
      client._uyeDavetEdenler = client._uyeDavetEdenler || new Map();
      for (const g of client.guilds.cache.values()) {
        await davetleriOnbellege(g, client).catch(() => {});
      }
    });

    // 5. RSS
    await adim('RSS', () => rssBaslat(client));
  },
};
