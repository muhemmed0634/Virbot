// ==========================================
//  VirBot — Hazır Olayı (Yeniden Yazım)
// ==========================================
'use strict';

const { ActivityType } = require('discord.js');
const { rssBaslat } = require('../modules/news/rssPoller');
const Guild = require('../database/models/Guild');
const { ayarlariYukle } = require('../modules/data/dataManager');
const { honeypotYukle } = require('../modules/security/honeypotManager');

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
      // Tüm sunucuların ayarlarını Ram'e ve honeypot'a yükle
      const sunucular = await Guild.find({});
      for (const g of sunucular) {
        await ayarlariYukle(g.guildId);
        await honeypotYukle(g.guildId);
      }
      console.log(`[DATA] ${sunucular.length} sunucunun ayarları yüklendi.`);
      
      // Eski çekilişleri tekrar başlat
      // require('../modules/giveaway/giveawayManager').aktifCekilisleriYukle(client);
      
      // RSS Başlat
      rssBaslat(client);
    } catch (hata) {
      console.error('[READY HATA]', hata);
    }
  },
};
