// ==========================================
//  VirBot — v!kick / /kick Komutu
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
  .setName('kick')
  .setDescription('Bir kullanıcıyı sunucudan atar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Sunucudan atılacak kullanıcı')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('sebep')
      .setDescription('Atılma sebebi')
      .setRequired(false)
  );

module.exports = {
  isim: 'kick',
  aciklama: 'Bir kullanıcıyı sunucudan atar.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin: `v!kick @kullanıcı [sebep]`');

    if (!hedef.kickable) return mesaj.reply('❌ Bu kullanıcıyı atamıyorum (yetkim yetersiz veya kullanıcı benden üst roldedir).');

    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    await hedef.kick(`${mesaj.author.tag}: ${sebep}`);

    const embed = new EmbedBuilder()
      .setTitle('👢 Kullanıcı Sunucudan Atıldı')
      .addFields(
        { name: 'Kullanıcı', value: `${hedef.user.tag} (<@${hedef.id}>)`, inline: true },
        { name: 'Yetkili', value: mesaj.author.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.HATA)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '👢 Kick — Kullanıcı Atıldı',
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

    if (!hedefMember.kickable) {
      return interaction.reply({ content: '❌ Bu kullanıcıyı atamıyorum (yetkim yetersiz veya üst rolde).', ephemeral: true });
    }

    await hedefMember.kick(`${interaction.user.tag}: ${sebep}`);

    const embed = new EmbedBuilder()
      .setTitle('👢 Kullanıcı Sunucudan Atıldı')
      .addFields(
        { name: 'Kullanıcı', value: `${hedefUser.tag} (<@${hedefUser.id}>)`, inline: true },
        { name: 'Yetkili', value: interaction.user.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.HATA)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '👢 Kick — Kullanıcı Atıldı (Slash)',
      `**Kullanıcı:** ${hedefUser.tag}\n**Yetkili:** ${interaction.user.tag}\n**Sebep:** ${sebep}`,
      RENKLER.HATA,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
