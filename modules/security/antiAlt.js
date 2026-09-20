// ==========================================
//  VirBot v2 — Anti-Alt Hesap Modülü
//  Yeni üyelerin hesap yaşını kontrol eder
// ==========================================
'use strict';

const { ANTI_ALT, RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../logger/logManager');
const { guildGetir } = require('../data/dataManager');

/**
 * Yeni katılan üyenin hesap yaşını kontrol eder.
 * Çok yeni hesaplar karantina rolüne atılır veya kicklenir.
 * @param {GuildMember} member
 * @param {Client} client
 */
async function antiAltKontrol(member, client) {
  try {
    const ayarlar = await guildGetir(member.guild.id);
    if (!ayarlar?.antiAltAktif) return;

    const olusturmaTarihi = member.user.createdTimestamp;
    const gunFarki = (Date.now() - olusturmaTarihi) / (1000 * 60 * 60 * 24);

    if (gunFarki >= ANTI_ALT.MIN_GUN) return; // Hesap yeterince eski

    const guild = member.guild;

    // Karantina rolü var mı kontrol et
    const karantinaRol = guild.roles.cache.find(r => r.name === ANTI_ALT.KARANTINA_ROL);

    if (karantinaRol) {
      // Tüm kanalları gizle, karantina rolünü ver
      await member.roles.add(karantinaRol, 'VirBot — Anti-Alt: Yeni hesap karantinaya alındı').catch(() => {});

      // DM gönder
      await member.send({
        content:
          `⚠️ **${guild.name}** sunucusuna hoş geldiniz!\n\n` +
          `Discord hesabınız çok yeni (${Math.floor(gunFarki)} gün) olduğundan **karantinaya** alındınız.\n` +
          `Sunucuya erişebilmek için bir yöneticiye başvurun.`,
      }).catch(() => {});
    } else {
      // Karantina rolü yoksa kick at
      await member.kick('VirBot — Anti-Alt: Hesap çok yeni').catch(() => {});
    }

    // Log
    const embed = logEmbed(
      '🛡️ Anti-Alt — Şüpheli Hesap Tespit Edildi',
      `**Kullanıcı:** ${member.user.tag} (<@${member.id}>)\n` +
      `**Hesap Yaşı:** ${Math.floor(gunFarki)} gün\n` +
      `**Minimum:** ${ANTI_ALT.MIN_GUN} gün\n` +
      `**İşlem:** ${karantinaRol ? `Karantina rolü verildi` : 'Kicklendi'}`,
      RENKLER.GUVENLIK,
    );
    await logGonder(client, guild.id, embed);

  } catch (hata) {
    console.error('[ANTİ-ALT] Hata:', hata.message);
  }
}

module.exports = { antiAltKontrol };
