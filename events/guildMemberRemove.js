// ==========================================
//  VirBot — guildMemberRemove Olayı
//  Modern Canvas Veda (Görüşmek Üzere) Kartı, Sayaç
// ==========================================
'use strict';

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { ayarGetir } = require('../modules/data/dataManager');
const { kartOlustur } = require('../modules/welcome/welcomeCard');

module.exports = {
  isim: 'guildMemberRemove',

  async calistir(client, member) {
    const guild = member.guild;
    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar) return;

    // 1. Çıkış Bildirimi ve Embed (Modern Panel)
    const cikisKanalId = ayarlar.girisCikisKanalId || ayarlar.cikisKanalId || ayarlar.girisKanalId || ayarlar.vedasKanalId;
    if (cikisKanalId) {
      const kanal = guild.channels.cache.get(cikisKanalId);
      if (kanal) {
        try {
          const buffer = await kartOlustur(member, 'cikis', guild.memberCount);
          const ek = new AttachmentBuilder(buffer, { name: 'gorusmek-uzere.png' });

          const userName = member.displayName || member.user?.globalName || member.user?.username || 'Kullanıcı';
          const avatarUrl = member.user?.displayAvatarURL
            ? member.user.displayAvatarURL({ extension: 'png', size: 256 })
            : null;

          const embed = new EmbedBuilder()
            .setColor(0xED4245) // Canlı Kırmızı
            .setTitle(`👋 Görüşmek üzere, ${userName}`)
            .setDescription(`**@${userName}** aramızdan ayrıldı. Görüşmek üzere!`)
            .setImage('attachment://gorusmek-uzere.png')
            .setFooter({ text: `${guild.name} • Sunucuda ${guild.memberCount} üye kaldı. • ID: ${member.id}` })
            .setTimestamp();

          if (avatarUrl) {
            embed.setThumbnail(avatarUrl);
          }

          await kanal.send({
            embeds: [embed],
            files: [ek],
          });
        } catch (err) {
          console.error('[ÇIKIŞ KARTI HATA]', err);
        }
      }
    }

    // 2. Sayaç Güncelleme
    if (ayarlar.sayacKanalId && ayarlar.sayacHedef) {
      const kanal = guild.channels.cache.get(ayarlar.sayacKanalId);
      if (kanal) {
        const kalan = ayarlar.sayacHedef - guild.memberCount;
        kanal.send(`📤 **${member.user?.tag || member.displayName}** ayrıldı. Hedefe ulaşmamıza **${kalan}** kişi kaldı.`).catch(() => {});
      }
    }
  },
};
