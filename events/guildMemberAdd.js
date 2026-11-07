// ==========================================
//  VirBot v6 — guildMemberAdd Olayı
//  Modern Canvas Hoş Geldin Kartı, Sayaç, Anti-Jail, Auto-Rol, Davet Takibi
// ==========================================
'use strict';

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { ayarGetir, ayarlariYukle, guildGuncelle } = require('../modules/data/dataManager');
const { antiAltKontrol } = require('../modules/security/antiAlt');
const { joinRaidKontrol } = require('../modules/security/antiRaid');
const { kartOlustur } = require('../modules/welcome/welcomeCard');
const { antiJailKontrol } = require('../modules/security/jailManager');
const { davetEdeniBul } = require('../modules/utils/davetTakip');

/**
 * Dashboard'dan ayarlanan özel karşılama metnini doldurur.
 * Desteklenen değişkenler: {uye} {kullanici} {sunucu} {sayi}
 */
function karsilamaMetni(sablon, member) {
  const varsayilan = `<@${member.id}>, **${member.guild.name}** sunucusuna hoş geldin!`;
  if (!sablon || !sablon.trim()) return varsayilan;
  // Değişken içermeyen metin "not" olarak varsayılan karşılamanın altına eklenir
  if (!/\{(uye|kullanici|sunucu|sayi)\}/i.test(sablon)) return `${varsayilan}\n> ${sablon.trim().slice(0, 500)}`;
  return sablon
    .replace(/\{uye\}/gi, `<@${member.id}>`)
    .replace(/\{kullanici\}/gi, member.user.username)
    .replace(/\{sunucu\}/gi, member.guild.name)
    .replace(/\{sayi\}/gi, String(member.guild.memberCount))
    .slice(0, 1500);
}

module.exports = {
  isim: 'guildMemberAdd',

  async calistir(client, member) {
    const guild = member.guild;
    let ayarlar = ayarGetir(guild.id);
    if (!ayarlar) {
      // Önbellekte yoksa (yeni sunucu vb.) veritabanından yükle — güvenlik kontrolleri atlanmasın
      ayarlar = (await ayarlariYukle(guild.id).catch(() => null))?.toObject?.() || null;
      if (!ayarlar) return;
    }

    // 0. Anti-Raid Toplu Giriş Saldırı Kontrolü
    const raidEngellendi = await joinRaidKontrol(member, client);
    if (raidEngellendi) return;

    // 1. Anti-Jail Kontrolü (hapiste olan biri geri döndüyse)
    const cezali = await antiJailKontrol(member, client);

    // 2. Anti-Alt Kontrolü — hesap atıldıysa karşılama/rol işlemleri yapılmaz
    const altAtildi = await antiAltKontrol(member, client);
    if (altAtildi) return;

    // Davet takibi her zaman çalışır (giriş kanalı olmasa da önbellek güncel kalmalı)
    const davetEden = await davetEdeniBul(member, client).catch(() => null);

    // 3. Karşılama Kartı ve Embed (Modern Panel)
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

          const davetSatiri = davetEden
            ? `📨 **Davet Eden:** ${davetEden.tag} (<@${davetEden.id}>)`
            : `📨 **Davet Eden:** Bilinmiyor`;

          const embed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle(`👋 Hoş geldin, ${userName}`)
            .setDescription(`${karsilamaMetni(ayarlar.ozelKarsilama, member)}\n${davetSatiri}`)
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

    // 5. Auto-Rol (cezalı kullanıcıya verilmez — aksi halde jail atlatılıyordu)
    if (ayarlar.autoRolId && !cezali) {
      const rol = guild.roles.cache.get(ayarlar.autoRolId);
      if (rol) {
        await member.roles.add(rol, 'VirBot v6 — Auto-Rol').catch(() => {});
      }
    }
  },
};
