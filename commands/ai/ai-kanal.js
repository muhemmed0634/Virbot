// ==========================================
//  VirBot — v!ai-kanal / /ai-kanal Komutu
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('ai-kanal')
  .setDescription('Yapay zeka (Gemini AI) sohbet kanalını ayarlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Tüm mesajların Gemini AI ile yanıtlanacağı metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

module.exports = {
  isim: 'ai-kanal',
  aciklama: 'Yapay zeka (Gemini AI) sohbet kanalını ayarlar.',
  kullanim: 'v!ai-kanal #kanal',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first() || mesaj.guild.channels.cache.get(args[0]);
    
    if (!kanal || kanal.type !== ChannelType.GuildText) {
      return mesaj.reply('❌ Lütfen bir metin kanalı etiketleyin: `v!ai-kanal #kanal`');
    }

    await guildGuncelle(mesaj.guild.id, { aiKanalId: kanal.id });

    const embed = new EmbedBuilder()
      .setTitle('🤖 Yapay Zeka Kanalı Ayarlandı')
      .setDescription(`Artık ${kanal} kanalına gönderilen tüm mesajlar **Gemini AI** tarafından akıllıca yanıtlanacak!`)
      .setColor(RENKLER.AI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🤖 AI Kanalı Ayarlandı',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}`,
      RENKLER.AI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const kanal = interaction.options.getChannel('kanal');

    if (!kanal || kanal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Lütfen geçerli bir metin kanalı seçin!', ephemeral: true });
    }

    await guildGuncelle(interaction.guild.id, { aiKanalId: kanal.id });

    const embed = new EmbedBuilder()
      .setTitle('🤖 Yapay Zeka Kanalı Ayarlandı')
      .setDescription(`Artık ${kanal} kanalına gönderilen tüm mesajlar **Gemini AI** tarafından akıllıca yanıtlanacak!`)
      .setColor(RENKLER.AI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🤖 AI Kanalı Ayarlandı (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Kanal:** ${kanal}`,
      RENKLER.AI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
