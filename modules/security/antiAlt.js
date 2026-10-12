// ==========================================
//  VirBot v6 — Anti-Alt Hesap Modülü
//  Yeni üyelerin hesap yaşını kontrol eder
//  Şüpheli hesapları doğrudan kickler (rol vermez)
// ==========================================
'use strict';

const { ANTI_ALT, RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../logger/logManager');
const { guildGetir } = require('../data/dataManager');

/**
 * Yeni katılan üyenin hesap yaşını kontrol eder.
 * Minimum günden yeni olan hesaplar doğrudan kicklenir.
 * @param {GuildMember} member
 * @param {Client} client
 */
async function antiAltKontrol(member, client) {
  try {
    const ayarlar = await guildGetir(member.guild.id);
    if (!ayarlar?.antiAltAktif) return;

    const olusturmaTarihi = member.user.createdTimestamp;
    const gunFarki = (Date.now() - olusturmaTarihi) / (1000 * 60 * 60 * 24);

    if (gunFarki >= (ANTI_ALT?.MIN_GUN || 7)) return; // Hesap yeterince eski

    const guild = member.guild;

    // DM gönder
    await member.send({
      content:
        `⚠️ **${guild.name}** sunucusuna katılımınız reddedildi!\n\n` +
        `Discord hesabınız çok yeni (${Math.floor(gunFarki)} gün) olduğu için VirBot v6 güvenlik sistemi tarafından sunucudan otomatik olarak çıkarıldınız (Kick).\n` +
        `Lütfen daha sonra tekrar deneyin veya sunucu yöneticileriyle iletişime geçin.`,
    }).catch(() => {});

    // Doğrudan kickle (rol verme!)
    await member.kick(`VirBot v6 — Anti-Alt: Yeni hesap tespiti (${Math.floor(gunFarki)} günlük)`).catch(() => {});

    // Log kanalına gönder
    const embed = logEmbed(
      '🛡️ Anti-Alt — Şüpheli Hesap Kicklendi',
      `**Kullanıcı:** ${member.user.tag} (<@${member.id}>)\n` +
      `**ID:** \`${member.id}\`\n` +
      `**Hesap Yaşı:** ${Math.floor(gunFarki)} gün\n` +
      `**Gereken Minimum:** ${ANTI_ALT?.MIN_GUN || 7} gün\n` +
      `**İşlem:** Sunucudan doğrudan atıldı (Kick)`,
      RENKLER.GUVENLIK,
    );
    await logGonder(client, guild.id, embed);

  } catch (hata) {
    console.error('[ANTİ-ALT] Hata:', hata.message);
  }
}

module.exports = { antiAltKontrol };
