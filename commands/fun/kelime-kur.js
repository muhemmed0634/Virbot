// ==========================================
//  VirBot — v!kelime-kur Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle, kelimeOyunuKaydet } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('kelime-kur')
  .setDescription('Kelime türetme oyunu kanalını ayarlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Kelime oyununun oynanacağı metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

module.exports = {
  isim: 'kelime-kur',
  aciklama: 'Kelime türetme oyunu kanalını ayarlar.',
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();
    
    if (!kanal) {
      return mesaj.reply('❌ Lütfen bir kanal etiketleyin. `v!kelime-kur #kanal`');
    }

    await guildGuncelle(mesaj.guild.id, { kelimeKanalId: kanal.id });
    
    // RAM'e de ekle
    kelimeOyunuKaydet(mesaj.guild.id, {
      kanalId: kanal.id,
      sonKelime: 'elma',
      sonOyuncu: null
    });

    const embed = new EmbedBuilder()
      .setTitle('🔤 Kelime Oyunu Kuruldu')
      .setDescription(
        `Kelime türetme oyunu ${kanal} kanalında başladı!\n\n` +
        `**Kurallar:**\n` +
        `1. Söylenen kelimenin **son harfiyle** başlayan yeni bir kelime türetmelisin.\n` +
        `2. Aynı kişi üst üste 2 kelime yazamaz.\n\n` +
        `Oyun **"elma"** kelimesi ile başladı! Hadi **"a"** ile başlayan bir kelime yaz.`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await kanal.send({ embeds: [embed] });
    await mesaj.reply(`✅ Kelime oyunu ${kanal} kanalına kuruldu.`);

    const logEmb = logEmbed(
      '🔤 Kelime Oyunu Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const kanal = interaction.options.getChannel('kanal');

    await guildGuncelle(interaction.guild.id, { kelimeKanalId: kanal.id });
    kelimeOyunuKaydet(interaction.guild.id, {
      kanalId: kanal.id,
      sonKelime: 'elma',
      sonOyuncu: null
    });

    const embed = new EmbedBuilder()
      .setTitle('🔤 Kelime Oyunu Kuruldu')
      .setDescription(
        `Kelime türetme oyunu ${kanal} kanalında başladı!\n\n` +
        `**Kurallar:**\n` +
        `1. Söylenen kelimenin **son harfiyle** başlayan yeni bir kelime türetmelisin.\n` +
        `2. Aynı kişi üst üste 2 kelime yazamaz.\n\n` +
        `Oyun **"elma"** kelimesi ile başladı! Hadi **"a"** ile başlayan bir kelime yaz.`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await kanal.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Kelime oyunu ${kanal} kanalına kuruldu.` });

    const logEmb = logEmbed(
      '🔤 Kelime Oyunu Kuruldu (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Kanal:** ${kanal}`,
      RENKLER.BASARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
