// ==========================================
//  VirBot — guildMemberUpdate Olayı
//  Rol güncellemelerini loglar
// ==========================================
'use strict';

const { ayarGetir } = require('../modules/data/dataManager');
const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { RENKLER } = require('../config/config');

module.exports = {
  isim: 'guildMemberUpdate',

  async calistir(client, oldMember, newMember) {
    const guild = newMember.guild;
    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar?.logKanalId) return; // Log kapalı

    // Sadece rol değişikliklerini yakalayalım
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
      const eklenenRoller = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
      const alinanRoller = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

      if (eklenenRoller.size > 0) {
        const rolIsimleri = eklenenRoller.map(r => r.name).join(', ');
        const embed = logEmbed(
          '🎭 Rol Verildi',
          `**Kullanıcı:** ${newMember.user.tag}\n**Verilen Rol(ler):** ${rolIsimleri}`,
          RENKLER.BILGI
        );
        await logGonder(client, guild.id, embed);
      }

      if (alinanRoller.size > 0) {
        const rolIsimleri = alinanRoller.map(r => r.name).join(', ');
        const embed = logEmbed(
          '🎭 Rol Alındı',
          `**Kullanıcı:** ${newMember.user.tag}\n**Alınan Rol(ler):** ${rolIsimleri}`,
          RENKLER.UYARI
        );
        await logGonder(client, guild.id, embed);
      }
    }
  },
};
