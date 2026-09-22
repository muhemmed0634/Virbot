// ==========================================
//  VirBot — Hazır Olayı (v2)
//  Slash Komut Kaydı, Çekiliş Yükleme, RSS
// ==========================================
'use strict';

const { ActivityType } = require('discord.js');
const { rssBaslat } = require('../modules/news/rssPoller');
const Guild = require('../database/models/Guild');
const { ayarlariYukle } = require('../modules/data/dataManager');
const { honeypotYukle } = require('../modules/security/honeypotManager');
const { aktifCekilisleriYukle } = require('../modules/giveaway/giveawayManager');

module.exports = {
  isim: 'ready',
  birKere: true,

  async calistir(client) {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  ✅  VirBot v2 Çevrimiçi!            ║`);
    console.log(`║  🤖  ${client.user.tag.padEnd(34)}║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    // Durum ayarla
    client.user.setPresence({
      activities: [{ name: 'v!yardim | VirBot v2', type: ActivityType.Watching }],
      status: 'online',
    });

    try {
      // 1. Tüm sunucuların ayarlarını Ram'e ve honeypot'a yükle
      const sunucular = await Guild.find({});
      for (const g of sunucular) {
        await ayarlariYukle(g.guildId);
        await honeypotYukle(g.guildId);
      }
      console.log(`[DATA] ${sunucular.length} sunucunun ayarları yüklendi.`);

      // 2. Aktif çekilişleri yükle ve zamanlayıcıları başlat
      await aktifCekilisleriYukle(client);

      // 3. Slash (/) Komutlarını Discord'a kaydet
      const slashListesi = [];
      if (client.komutlar) {
        for (const komut of client.komutlar.values()) {
          if (komut.slashData && !slashListesi.some(s => s.name === komut.slashData.name)) {
            slashListesi.push(komut.slashData.toJSON ? komut.slashData.toJSON() : komut.slashData);
          }
        }
      }

      if (slashListesi.length > 0) {
        await client.application.commands.set(slashListesi);
        console.log(`[SLASH] ✅ ${slashListesi.length} slash komut Discord API'ye başarıyla kaydedildi.`);
      }

      // 4. RSS Başlat
      rssBaslat(client);
    } catch (hata) {
      console.error('[READY HATA]', hata);
    }
  },
};
