// ==========================================
//  VirBot v6 — guildMemberAdd Olayı
//  Modern Canvas Hoş Geldin Kartı, Sayaç, Anti-Jail, Auto-Rol, Davet Takibi
// ==========================================
'use strict';

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { ayarGetir, guildGuncelle } = require('../modules/data/dataManager');
const { antiAltKontrol } = require('../modules/security/antiAlt');
const { joinRaidKontrol } = require('../modules/security/antiRaid');
const { kartOlustur } = require('../modules/welcome/welcomeCard');
const { antiJailKontrol } = require('../modules/security/jailManager');

module.exports = {
  isim: 'guildMemberAdd',

  async calistir(client, member) {
    const guild = member.guild;
    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar) return;

    // 0. Anti-Raid Toplu Giriş Saldırı Kontrolü
    const raidEngellendi = await joinRaidKontrol(member, client);
    if (raidEngellendi) return;

    // 1. Anti-Jail Kontrolü (hapiste olan biri geri döndüyse)
    await antiJailKontrol(member, client);

    // 2. Anti-Alt Kontrolü (varsa)
    if (antiAltKontrol) {
      await antiAltKontrol(member, client);
    }

    // 3. Karşılama Kartı ve Embed (Modern Panel)
    const girisKanalId = ayarlar.girisCikisKanalId || ayarlar.girisKanalId || ayarlar.karsilamaKanalId;
    if (girisKanalId) {
      const kanal = guild.channels.cache.get(girisKanalId);
      if (kanal) {
        try {
          // Davet Eden Kim?
          let davetEden = null;
          try {
            const invites = await guild.invites.fetch().catch(() => null);
            if (invites && client._oncekiDavetler) {
              const onceki = client._oncekiDavetler.get(guild.id);
              if (onceki) {
                for (const [kod, davet] of invites) {
                  const eskiDavet = onceki.get(kod);
                  if (eskiDavet && davet.uses > eskiDavet.uses) {
                    davetEden = davet.inviter;
                    if (client._uyeDavetEdenler) client._uyeDavetEdenler.set(member.id, davetEden);
                    break;
                  }
                }
              }
              client._oncekiDavetler.set(guild.id, new Map(invites.map(inv => [inv.code, inv])));
            }
          } catch (_) {}

          const buffer = await kartOlustur(member, 'giris', guild.memberCount);
          const ek = new AttachmentBuilder(buffer, { name: 'hosgeldin.png' });

          const userName = member.displayName || member.user?.globalName || member.user?.username || 'Kullanıcı';
          const avatarUrl = member.user?.displayAvatarURL
            ? member.user.displayAvatarURL({ extension: 'png', size: 256 })
            : null;

          const davetSatiri = davetEden
            ? `📨 **Davet Eden:** ${davetEden.tag} (<@${davetEden.id}>)`
            : `📨 **Davet Eden:** Bilinmiyor`;

          const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle(`👋 Hoş geldin, ${userName}`)
            .setDescription(`<@${member.id}> , ${guild.name} sunucusuna hoş geldin!\n${davetSatiri}`)
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

    // 4. Sayaç Güncelleme
    if (ayarlar.sayacKanalId && ayarlar.sayacHedef) {
      const kanal = guild.channels.cache.get(ayarlar.sayacKanalId);
      if (kanal) {
        const kalan = ayarlar.sayacHedef - guild.memberCount;
        if (kalan <= 0) {
          kanal.send(`🎉 Hedefimize ulaştık! Artık **${ayarlar.sayacHedef}** kişiyiz!`).catch(() => {});
          await guildGuncelle(guild.id, { sayacHedef: 0 });
        } else {
          kanal.send(`📥 ${member} katıldı! Hedefe ulaşmamıza son **${kalan}** kişi kaldı.`).catch(() => {});
        }
      }
    }

    // 5. Auto-Rol
    if (ayarlar.autoRolId) {
      const rol = guild.roles.cache.get(ayarlar.autoRolId);
      if (rol) {
        await member.roles.add(rol, 'VirBot v6 — Auto-Rol').catch(() => {});
      }
    }
  },
};
