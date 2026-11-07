// ==========================================
//  VirBot — v!haber / /haber Komutu
//  DonanımHaber RSS akışını bağlar
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { haberEkle } = require('../../modules/news/rssPoller');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('haber')
  .setDescription('DonanımHaber RSS teknoloji haberleri akışını bir kanala bağlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Haberlerin gönderileceği metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

module.exports = {
  isim: 'haber',
  alternatifler: ['haberler', 'news'],
  aciklama: 'DonanımHaber RSS akışını belirtilen kanala bağlar.',
  kullanim: 'v!haber #kanal',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first() || mesaj.guild.channels.cache.get(args[0]);

    if (!kanal || kanal.type !== ChannelType.GuildText) {
      const embed = new EmbedBuilder()
        .setDescription('❌ Lütfen bir metin kanalı etiketleyin!\n**Kullanım:** `v!haber #kanal`')
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    const eklendi = await haberEkle(mesaj.guild.id, kanal.id);

    if (!eklendi) {
      const embed = new EmbedBuilder()
        .setDescription(`⚠️ DonanımHaber akışı zaten **${kanal}** kanalına bağlı!`)
        .setColor(RENKLER.UYARI);
      return mesaj.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📰 Haber Akışı Bağlandı')
      .setDescription(
        `DonanımHaber RSS akışı başarıyla ${kanal} kanalına bağlandı.\n\n` +
        `Yeni teknoloji haberleri otomatik olarak bu kanalda paylaşılacaktır.`
      )
      .setColor(RENKLER.HABER)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
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

    const eklendi = await haberEkle(interaction.guild.id, kanal.id);

    if (!eklendi) {
      return interaction.reply({
        content: `⚠️ DonanımHaber akışı zaten **${kanal}** kanalına bağlı!`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📰 Haber Akışı Bağlandı')
      .setDescription(
        `DonanımHaber RSS akışı başarıyla ${kanal} kanalına bağlandı.\n\n` +
        `Yeni teknoloji haberleri otomatik olarak bu kanalda paylaşılacaktır.`
      )
      .setColor(RENKLER.HABER)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
