// ==========================================
//  VirBot — v!unmute / /unmute Komutu
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
  .setName('unmute')
  .setDescription('Bir kullanıcının susturmasını (timeout) kaldırır.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Susturması kaldırılacak kullanıcı')
      .setRequired(true)
  );

module.exports = {
  isim: 'unmute',
  aciklama: 'Bir kullanıcının susturmasını kaldırır.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin: `v!unmute @kullanıcı`');

    await hedef.timeout(null, `${mesaj.author.tag}: Mute kaldırıldı`).catch(e => {
      return mesaj.reply(`❌ Timeout kaldırılamadı: ${e.message}`);
    });

    const embed = new EmbedBuilder()
      .setTitle('🔊 Susturma Kaldırıldı')
      .setDescription(`${hedef} kullanıcısının susturması başarıyla kaldırıldı.`)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔊 Unmute — Susturma Kaldırıldı',
      `**Kullanıcı:** ${hedef.user.tag}\n**Yetkili:** ${mesaj.author.tag}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const hedefUser = interaction.options.getUser('hedef');
    const hedefMember = await interaction.guild.members.fetch(hedefUser.id).catch(() => null);

    if (!hedefMember) {
      return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    }

    try {
      await hedefMember.timeout(null, `${interaction.user.tag}: Mute kaldırıldı`);
    } catch (e) {
      return interaction.reply({ content: `❌ Susturma kaldırılamadı: ${e.message}`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔊 Susturma Kaldırıldı')
      .setDescription(`<@${hedefMember.id}> kullanıcısının susturması başarıyla kaldırıldı.`)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔊 Unmute — Susturma Kaldırıldı (Slash)',
      `**Kullanıcı:** ${hedefMember.user.tag}\n**Yetkili:** ${interaction.user.tag}`,
      RENKLER.BASARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
