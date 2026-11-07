// ==========================================
//  VirBot — guildMemberRemove Olayı
//  Modern Canvas Veda (Görüşmek Üzere) Kartı, Sayaç
// ==========================================
'use strict';

const { AttachmentBuilder, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { ayarGetir } = require('../modules/data/dataManager');
const { kartOlustur } = require('../modules/welcome/welcomeCard');
const { massKickKontrol } = require('../modules/security/antiRaid');
const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { RENKLER } = require('../config/config');
const { davetEdenGetir } = require('../modules/utils/davetTakip');

/**
 * Üye atıldıysa (kick) denetim kaydından yapanı bulur, loglar ve Mass-Kick korumasını çalıştırır.
 */
async function kickKontrol(client, member) {
  const guild = member.guild;
  const loglar = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 }).catch(() => null);
  const giris = loglar?.entries?.find(e =>
    e.targetId === member.id && Date.now() - e.createdTimestamp < 10_000
  );
  if (!giris) return; // Kendi isteğiyle ayrıldı

  const logEmb = logEmbed(
    '👢 Kullanıcı Atıldı (Kick)',
    `**Kullanıcı:** ${member.user?.tag || member.id} (<@${member.id}>)\n` +
    `**ID:** \`${member.id}\`\n` +
    `**Atan:** ${giris.executor ? `${giris.executor.tag} (<@${giris.executor.id}>)` : 'Bilinmiyor'}\n` +
    `**Sebep:** ${giris.reason || 'Belirtilmedi'}`,
    RENKLER.HATA
  );
  await logGonder(client, guild.id, logEmb);
  await massKickKontrol(guild, giris.executorId, client);
}

module.exports = {
  isim: 'guildMemberRemove',

  async calistir(client, member) {
    const guild = member.guild;

    // 0. Kick tespiti + Mass-Kick koruması
    await kickKontrol(client, member).catch(err => console.error('[KICK KONTROL]', err.message));

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

          const davetEden = davetEdenGetir(member, client);
          const davetSatiri = davetEden
            ? `📨 **Davet Eden:** ${davetEden.tag} (<@${davetEden.id}>)`
            : `📨 **Davet Eden:** Bilinmiyor`;

          const embed = new EmbedBuilder()
            .setColor(0xED4245) // Canlı Kırmızı
            .setTitle(`👋 Görüşmek üzere, ${userName}`)
            .setDescription(`**@${userName}** aramızdan ayrıldı. Görüşmek üzere!\n${davetSatiri}`)
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

    // Davet kaydını bellekten çıkar (RAM sızıntısı olmasın)
    client._uyeDavetEdenler?.delete(`${guild.id}-${member.id}`);

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
