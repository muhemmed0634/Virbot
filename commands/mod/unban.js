// ==========================================
//  VirBot — v!unban / /unban Komutu
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
  .setName('unban')
  .setDescription('Bir kullanıcının sunucudaki yasağını kaldırır.')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addStringOption(opt =>
    opt
      .setName('id')
      .setDescription('Yasağı kaldırılacak kullanıcının Discord ID numarası')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('sebep')
      .setDescription('Yasağın kaldırılma sebebi')
      .setRequired(false)
  );

module.exports = {
  isim: 'unban',
  aciklama: 'Bir kullanıcının yasağını kaldırır.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (!yetkiliMi(mesaj.member)) return yetkiRed(mesaj, true);

    const userId = args[0];
    if (!userId || !/^\d{17,20}$/.test(userId)) {
      return mesaj.reply('❌ Geçerli bir kullanıcı ID girin: `v!unban <userId> [sebep]`');
    }

    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    try {
      await mesaj.guild.members.unban(userId, `${mesaj.author.tag}: ${sebep}`);
    } catch {
      return mesaj.reply('❌ Kullanıcı yasaklı değil ya da ID hatalı.');
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Yasak Kaldırıldı')
      .addFields(
        { name: 'Kullanıcı ID', value: userId, inline: true },
        { name: 'Yetkili', value: mesaj.author.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '✅ Unban — Yasak Kaldırıldı',
      `**Kullanıcı ID:** ${userId}\n**Yetkili:** ${mesaj.author.tag}\n**Sebep:** ${sebep}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const userId = interaction.options.getString('id').trim();
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    try {
      await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${sebep}`);
    } catch {
      return interaction.reply({ content: '❌ Belirtilen kullanıcı yasaklı değil ya da ID hatalı.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Yasak Kaldırıldı')
      .addFields(
        { name: 'Kullanıcı ID', value: userId, inline: true },
        { name: 'Yetkili', value: interaction.user.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '✅ Unban — Yasak Kaldırıldı (Slash)',
      `**Kullanıcı ID:** ${userId}\n**Yetkili:** ${interaction.user.tag}\n**Sebep:** ${sebep}`,
      RENKLER.BASARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
