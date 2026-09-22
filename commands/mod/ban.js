// ==========================================
//  VirBot — v!ban / /ban Komutu
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
  .setName('ban')
  .setDescription('Bir kullanıcıyı sunucudan yasaklar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Yasaklanacak kullanıcı')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('sebep')
      .setDescription('Yasaklama sebebi')
      .setRequired(false)
  );

module.exports = {
  isim: 'ban',
  aciklama: 'Bir kullanıcıyı sunucudan yasaklar.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin: `v!ban @kullanıcı [sebep]`');

    if (!hedef.bannable) return mesaj.reply('❌ Bu kullanıcıyı yasaklayamıyorum (yetkim yetersiz veya kullanıcı benden üst roldedir).');

    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    await hedef.ban({ reason: `${mesaj.author.tag}: ${sebep}` });

    const embed = new EmbedBuilder()
      .setTitle('🔨 Kullanıcı Yasaklandı')
      .addFields(
        { name: 'Kullanıcı', value: `${hedef.user.tag} (<@${hedef.id}>)`, inline: true },
        { name: 'Yetkili', value: mesaj.author.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.HATA)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔨 Ban — Kullanıcı Yasaklandı',
      `**Kullanıcı:** ${hedef.user.tag}\n**Yetkili:** ${mesaj.author.tag}\n**Sebep:** ${sebep}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const hedefUser = interaction.options.getUser('hedef');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    const hedefMember = await interaction.guild.members.fetch(hedefUser.id).catch(() => null);
    if (!hedefMember) {
      return interaction.reply({ content: '❌ Kullanıcı bu sunucuda bulunamadı.', ephemeral: true });
    }

    if (!hedefMember.bannable) {
      return interaction.reply({ content: '❌ Bu kullanıcıyı yasaklayamıyorum (yetkim yetersiz veya üst rolde).', ephemeral: true });
    }

    await hedefMember.ban({ reason: `${interaction.user.tag}: ${sebep}` });

    const embed = new EmbedBuilder()
      .setTitle('🔨 Kullanıcı Yasaklandı')
      .addFields(
        { name: 'Kullanıcı', value: `${hedefUser.tag} (<@${hedefUser.id}>)`, inline: true },
        { name: 'Yetkili', value: interaction.user.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.HATA)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔨 Ban — Kullanıcı Yasaklandı (Slash)',
      `**Kullanıcı:** ${hedefUser.tag}\n**Yetkili:** ${interaction.user.tag}\n**Sebep:** ${sebep}`,
      RENKLER.HATA,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
