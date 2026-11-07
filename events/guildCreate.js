// ==========================================
//  VirBot — guildCreate Olayı
//  Bot yeni bir sunucuya eklendiğinde ayarları RAM'e yükler
// ==========================================
'use strict';

const { ayarlariYukle } = require('../modules/data/dataManager');
const { davetleriOnbellege } = require('../modules/utils/davetTakip');
const { honeypotYukle } = require('../modules/security/honeypotManager');

module.exports = {
  isim: 'guildCreate',

  async calistir(client, guild) {
    try {
      await ayarlariYukle(guild.id);
      await honeypotYukle(guild.id).catch(() => {});
      console.log(`[SUNUCU] ➕ ${guild.name} (${guild.id}) eklendi, ayarlar yüklendi.`);

      // Davet takibi önbelleği
      await davetleriOnbellege(guild, client);
    } catch (err) {
      console.error('[SUNUCU] guildCreate hatası:', err.message);
    }
  },
};
