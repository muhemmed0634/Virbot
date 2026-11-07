// ==========================================
//  VirBot v6 — Yetki Kontrol Modülü
//  Administrator iznine sahip rol kontrolü
//  Normal kullanıcılar YALNIZCA RPG komutlarını kullanabilir
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');

/**
 * GuildMember'ın herhangi bir rolünde Administrator izninin açık olup olmadığını kontrol eder.
 * Rol adı değil, RolDeizni (PermissionFlagsBits.Administrator) kontrol edilir.
 * @param {GuildMember} member
 * @returns {boolean}
 */
function yetkiliMi(member) {
  if (!member) return false;
  // Sunucu sahibi her zaman yetkili
  if (member.guild?.ownerId === member.id) return true;
  // Herhangi bir rolünde Administrator izni açık mı?
  return member.permissions.has('Administrator');
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
      'Yalnızca rolünde **Yönetici** (Administrator) izni açık olan kullanıcılar bu komutu kullanabilir.\n' +
      '> 💡 Normal kullanıcılar yalnızca **RPG** komutlarını kullanabilir.'
    )
    .setColor(0xED4245)
    .setTimestamp()
    .setFooter({ text: 'VirBot v6' });

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

/**
 * Komutun çalıştırılıp çalıştırılamayacağını kontrol eder.
 * - adminGerekli: true → yalnızca yetkili
 * - rpgKomutu: true → herkes kullanabilir
 * - ikisi de false → yalnızca yetkili (güvenlik için)
 * @param {Object} komut
 * @param {GuildMember} member
 * @returns {boolean} erişim var mı
 */
function erisimVarMi(komut, member) {
  // RPG / herkese açık komut → herkes kullanabilir
  if (komut.rpgKomutu === true || komut.herkes === true) return true;
  // Admin gerekli veya sınıflandırılmamış → yönetici izni lazım
  return yetkiliMi(member);
}

/**
 * Moderasyon işlemlerinde rol hiyerarşisini kontrol eder.
 * @param {GuildMember} yapan - İşlemi yapan yetkili
 * @param {GuildMember} hedef - İşlem uygulanacak üye
 * @param {Client} client
 * @returns {string|null} Hata mesajı veya null (sorun yok)
 */
function hiyerarsiHatasi(yapan, hedef, client) {
  if (!yapan || !hedef) return '❌ Kullanıcı bulunamadı.';
  if (hedef.id === yapan.id) return '❌ Bu işlemi kendinize uygulayamazsınız.';
  if (hedef.id === client.user.id) return '❌ Bu işlemi bana uygulayamazsınız!';
  if (hedef.id === hedef.guild.ownerId) return '❌ Sunucu sahibine bu işlem uygulanamaz.';
  if (yapan.id !== yapan.guild.ownerId && hedef.roles.highest.position >= yapan.roles.highest.position) {
    return '❌ Bu kullanıcının rolü sizinkiyle eşit veya daha yüksek.';
  }
  return null;
}

module.exports = { yetkiliMi, yetkiRed, erisimVarMi, hiyerarsiHatasi };
