// ==========================================
//  VirBot — v!nuke / /nuke Komutu
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('nuke')
  .setDescription('Mevcut kanalı tamamen sıfırlayıp baştan oluşturur (tüm mesajlar silinir).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

module.exports = {
  isim: 'nuke',
  aciklama: 'Kanalı kopyalayarak tüm mesajları temizler ve sıfırlar.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (!mesaj.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return mesaj.reply('❌ Bu komutu kullanmak için `Kanalları Yönet` yetkisine sahip olmalısınız.');
    }

    const kanal = mesaj.channel;
    const pozisyon = kanal.position;

    try {
      const yeniKanal = await kanal.clone({
        reason: `VirBot — Nuke komutu (${mesaj.author.tag})`,
      });

      await yeniKanal.setPosition(pozisyon);
      await kanal.delete(`VirBot — Nuke komutu (${mesaj.author.tag})`);

      const embed = new EmbedBuilder()
        .setColor(RENKLER.BASARILI)
        .setTitle('💣 Kanal Sıfırlandı (Nuke)')
        .setDescription(`Bu kanal <@${mesaj.author.id}> tarafından başarıyla sıfırlandı!`)
        .setImage('https://media.giphy.com/media/oe33xf3B5bWSY/giphy.gif')
        .setTimestamp();

      await yeniKanal.send({ embeds: [embed] });

      const logEmb = logEmbed(
        '💣 Kanal Sıfırlandı (Nuke)',
        `**Kanal:** <#${yeniKanal.id}>\n**Yetkili:** ${mesaj.author.tag}`,
        RENKLER.HATA,
      );
      await logGonder(client, mesaj.guild.id, logEmb);
    } catch (err) {
      console.error('[NUKE] Hata:', err.message);
      await mesaj.reply('❌ Kanal sıfırlanırken bir hata oluştu.').catch(() => {});
    }
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const kanal = interaction.channel;
    const pozisyon = kanal.position;

    try {
      await interaction.reply({ content: '💣 Kanal sıfırlanıyor...', ephemeral: true });

      const yeniKanal = await kanal.clone({
        reason: `VirBot — Nuke komutu (${interaction.user.tag})`,
      });

      await yeniKanal.setPosition(pozisyon);
      await kanal.delete(`VirBot — Nuke komutu (${interaction.user.tag})`);

      const embed = new EmbedBuilder()
        .setColor(RENKLER.BASARILI)
        .setTitle('💣 Kanal Sıfırlandı (Nuke)')
        .setDescription(`Bu kanal <@${interaction.user.id}> tarafından başarıyla sıfırlandı!`)
        .setImage('https://media.giphy.com/media/oe33xf3B5bWSY/giphy.gif')
        .setTimestamp();

      await yeniKanal.send({ embeds: [embed] });

      const logEmb = logEmbed(
        '💣 Kanal Sıfırlandı (Nuke Slash)',
        `**Kanal:** <#${yeniKanal.id}>\n**Yetkili:** ${interaction.user.tag}`,
        RENKLER.HATA,
      );
      await logGonder(client, interaction.guild.id, logEmb);
    } catch (err) {
      console.error('[NUKE] Slash Hata:', err.message);
    }
  },
};
