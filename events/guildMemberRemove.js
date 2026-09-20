// ==========================================
//  VirBot — guildMemberRemove Olayı
//  Çıkış Bildirimi, Sayaç
// ==========================================
'use strict';

const { ayarGetir } = require('../modules/data/dataManager');
const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../config/config');

module.exports = {
  isim: 'guildMemberRemove',

  async calistir(client, member) {
    const guild = member.guild;
    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar) return;

    // Çıkış Mesajı
    if (ayarlar.girisKanalId) {
      const kanal = guild.channels.cache.get(ayarlar.girisKanalId);
      if (kanal) {
        const embed = new EmbedBuilder()
          .setDescription(`👋 **${member.user.tag}** sunucudan ayrıldı. \nŞu an **${guild.memberCount}** kişiyiz.`)
          .setColor(RENKLER.HATA);
        kanal.send({ embeds: [embed] }).catch(()=>{});
      }
    }

    // Sayaç Güncelleme
    if (ayarlar.sayacKanalId && ayarlar.sayacHedef) {
      const kanal = guild.channels.cache.get(ayarlar.sayacKanalId);
      if (kanal) {
        const kalan = ayarlar.sayacHedef - guild.memberCount;
        kanal.send(`📤 **${member.user.tag}** ayrıldı. Hedefe ulaşmamıza **${kalan}** kişi kaldı.`).catch(()=>{});
      }
    }
  },
};
