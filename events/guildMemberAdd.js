// ==========================================
//  VirBot — guildMemberAdd Olayı
//  Modern Canvas Hoş Geldin Kartı, Sayaç
// ==========================================
'use strict';

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { ayarGetir, guildGuncelle } = require('../modules/data/dataManager');
const { antiAltKontrol } = require('../modules/security/antiAlt');
const { kartOlustur } = require('../modules/welcome/welcomeCard');

module.exports = {
  isim: 'guildMemberAdd',

  async calistir(client, member) {
    const guild = member.guild;
    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar) return;

    // 1. Anti-Alt Kontrolü (varsa)
    if (antiAltKontrol) {
      await antiAltKontrol(member, client);
    }

    // 2. Karşılama Kartı ve Embed (Modern Panel)
    const girisKanalId = ayarlar.girisCikisKanalId || ayarlar.girisKanalId || ayarlar.karsilamaKanalId;
    if (girisKanalId) {
      const kanal = guild.channels.cache.get(girisKanalId);
      if (kanal) {
        try {
          const buffer = await kartOlustur(member, 'giris', guild.memberCount);
          const ek = new AttachmentBuilder(buffer, { name: 'hosgeldin.png' });

          const userName = member.displayName || member.user?.globalName || member.user?.username || 'Kullanıcı';
          const avatarUrl = member.user?.displayAvatarURL
            ? member.user.displayAvatarURL({ extension: 'png', size: 256 })
            : null;

          const embed = new EmbedBuilder()
            .setColor(0x2ECC71) // Neon/Vibrant Yeşil
            .setTitle(`👋 Hoş geldin, ${userName}`)
            .setDescription(`<@${member.id}> , ${guild.name} sunucusuna hoş geldin!`)
            .setImage('attachment://hosgeldin.png')
            .setFooter({ text: `${guild.name} • ${guild.memberCount}. üye • ID: ${member.id}` })
            .setTimestamp();

          if (avatarUrl) {
            embed.setThumbnail(avatarUrl);
          }

          await kanal.send({
            content: `<@${member.id}>`,
            embeds: [embed],
            files: [ek],
          });
        } catch (err) {
          console.error('[GİRİŞ KARTI HATA]', err);
        }
      }
    }

    // 3. Sayaç Güncelleme
    if (ayarlar.sayacKanalId && ayarlar.sayacHedef) {
      const kanal = guild.channels.cache.get(ayarlar.sayacKanalId);
      if (kanal) {
        const kalan = ayarlar.sayacHedef - guild.memberCount;
        if (kalan <= 0) {
          kanal.send(`🎉 Hedefimize ulaştık! Artık **${ayarlar.sayacHedef}** kişiyiz!`).catch(() => {});
          await guildGuncelle(guild.id, { sayacHedef: 0 }); // Hedefe ulaşıldı, sıfırla
        } else {
          kanal.send(`📥 ${member} katıldı! Hedefe ulaşmamıza son **${kalan}** kişi kaldı.`).catch(() => {});
        }
      }
    }
  },
};
