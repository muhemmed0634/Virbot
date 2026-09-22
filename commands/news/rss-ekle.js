// ==========================================
//  VirBot — v!rss-ekle / /rss-ekle Komutu
//  Özel RSS kaynağı ekler
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { rssEkle } = require('../../modules/news/rssPoller');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('rss-ekle')
  .setDescription('Özel bir RSS haber akışını belirtilen kanala bağlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(opt =>
    opt
      .setName('url')
      .setDescription('RSS besleme bağlantı linki (örn: https://site.com/rss)')
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Haberlerin gönderileceği metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

module.exports = {
  isim: 'rss-ekle',
  alternatifler: ['rssekle', 'rss-add'],
  aciklama: 'Özel bir RSS akışını belirtilen kanala bağlar.',
  kullanim: 'v!rss-ekle [RSS_URL] #kanal',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first() || mesaj.guild.channels.cache.get(args.find(a => !a.startsWith('http')));
    const url = args.find(a => a.startsWith('http://') || a.startsWith('https://'));

    if (!url || !kanal || kanal.type !== ChannelType.GuildText) {
      const embed = new EmbedBuilder()
        .setDescription(
          '❌ Eksik veya hatalı parametre!\n' +
          '**Kullanım:** `v!rss-ekle [RSS_URL] #kanal`\n' +
          '**Örnek:** `v!rss-ekle https://example.com/rss #haberler`'
        )
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    try {
      new URL(url);
    } catch {
      const embed = new EmbedBuilder()
        .setDescription('❌ Geçersiz URL! Lütfen geçerli bir RSS web bağlantısı girin.')
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    const eklendi = await rssEkle(mesaj.guild.id, url, kanal.id);

    if (!eklendi) {
      const embed = new EmbedBuilder()
        .setDescription(`⚠️ Bu RSS kaynağı zaten **${kanal}** kanalına bağlı!`)
        .setColor(RENKLER.UYARI);
      return mesaj.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📡 RSS Kaynağı Eklendi')
      .setDescription(
        `Özel RSS akışı başarıyla eklendi!\n\n` +
        `**URL:** \`${url}\`\n` +
        `**Kanal:** ${kanal}\n\n` +
        `Yeni içerikler otomatik olarak bu kanalda paylaşılacaktır.`
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

    const url = interaction.options.getString('url').trim();
    const kanal = interaction.options.getChannel('kanal');

    if (!kanal || kanal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Lütfen geçerli bir metin kanalı seçin!', ephemeral: true });
    }

    try {
      new URL(url);
    } catch {
      return interaction.reply({ content: '❌ Geçersiz URL! Lütfen geçerli bir http/https bağlantısı girin.', ephemeral: true });
    }

    const eklendi = await rssEkle(interaction.guild.id, url, kanal.id);

    if (!eklendi) {
      return interaction.reply({
        content: `⚠️ Bu RSS kaynağı zaten **${kanal}** kanalına bağlı!`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📡 RSS Kaynağı Eklendi')
      .setDescription(
        `Özel RSS akışı başarıyla eklendi!\n\n` +
        `**URL:** \`${url}\`\n` +
        `**Kanal:** ${kanal}\n\n` +
        `Yeni içerikler otomatik olarak bu kanalda paylaşılacaktır.`
      )
      .setColor(RENKLER.HABER)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
