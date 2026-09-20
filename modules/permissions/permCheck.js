// ==========================================
//  VirBot v2 — Yetki Kontrol Modülü
//  @Admin veya @Kurucu rolü kontrolü
// ==========================================
'use strict';

const { YETKILI_ROLLER } = require('../../config/config');
const { EmbedBuilder } = require('discord.js');

/**
 * GuildMember'ın yetkili olup olmadığını kontrol eder.
 * @param {GuildMember} member
 * @returns {boolean}
 */
function yetkiliMi(member) {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  return member.roles.cache.some(r => YETKILI_ROLLER.includes(r.name));
}

/**
 * Yetkisiz kullanıcıya hata embed'i gönderir.
 * @param {Message|Interaction} hedef
 * @param {boolean} sil - Prefix komutunda orijinal mesaj silinsin mi?
 */
async function yetkiRed(hedef, sil = false) {
  const embed = new EmbedBuilder()
    .setTitle('🚫 Yetkisiz Erişim')
    .setDescription(
      'Bu komutu kullanmak için **yetkiniz bulunmamaktadır!**\n\n' +
      `Yalnızca <@&${hedef.guild?.roles.cache.find(r => r.name === 'Admin')?.id || 'Admin'}> ve ` +
      `<@&${hedef.guild?.roles.cache.find(r => r.name === 'Kurucu')?.id || 'Kurucu'}> rolleri kullanabilir.`
    )
    .setColor(0xED4245)
    .setTimestamp();

  if (hedef.reply) {
    await hedef.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
  } else if (hedef.send) {
    const m = await hedef.send({ embeds: [embed] }).catch(() => null);
    if (m) setTimeout(() => m.delete().catch(() => {}), 5000);
  }

  if (sil && hedef.deletable) {
    hedef.delete().catch(() => {});
  }
}

module.exports = { yetkiliMi, yetkiRed };
