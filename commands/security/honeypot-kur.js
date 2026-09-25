// ==========================================
//  VirBot — v!honeypot-kur Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { honeypotEkle } = require('../../modules/security/honeypotManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('honeypot-kur')
  .setDescription('Spam/botları yakalamak için tuzak (honeypot) kanal belirler.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Tuzak olarak kullanılacak metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

module.exports = {
  isim: 'honeypot-kur',
  aciklama: 'Spam/botları yakalamak için tuzak (honeypot) kanal belirler.',
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();

    if (!kanal) {
      return mesaj.reply('❌ Lütfen bir kanal etiketleyin. Kullanım: `v!honeypot-kur #kanal`');
    }

    await guildGuncelle(mesaj.guild.id, { honeypotKanalId: kanal.id });
    honeypotEkle(kanal.id);

    const embed = new EmbedBuilder()
      .setTitle('🍯 Honeypot Sistemi Kuruldu')
      .setDescription(
        `Tuzak kanal başarıyla ${kanal} olarak ayarlandı.\n\n` +
        `⚠️ Lütfen bu kanalı **herkese açık ama görünmez (read messages: false)** yapın.\n` +
        `Bu kanala mesaj gönderen kullanıcılar otomatik olarak sunucudan atılacaktır.`
      )
      .setColor(RENKLER.GUVENLIK)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🍯 Honeypot Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Tuzak Kanal:** ${kanal}`,
      RENKLER.GUVENLIK,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const kanal = interaction.options.getChannel('kanal');

    await guildGuncelle(interaction.guild.id, { honeypotKanalId: kanal.id });
    honeypotEkle(kanal.id);

    const embed = new EmbedBuilder()
      .setTitle('🍯 Honeypot Sistemi Kuruldu')
      .setDescription(
        `Tuzak kanal başarıyla ${kanal} olarak ayarlandı.\n\n` +
        `⚠️ Lütfen bu kanalı **herkese açık ama görünmez (read messages: false)** yapın.\n` +
        `Bu kanala mesaj gönderen kullanıcılar otomatik olarak sunucudan atılacaktır.`
      )
      .setColor(RENKLER.GUVENLIK)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🍯 Honeypot Kuruldu (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Tuzak Kanal:** ${kanal}`,
      RENKLER.GUVENLIK,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
