// ==========================================
//  VirBot — v!background-set Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGuncelle } = require('../../modules/data/dataManager');

const slashData = new SlashCommandBuilder()
  .setName('background-set')
  .setDescription('Rank kartı arka plan resmini değiştirir.')
  .addStringOption(opt =>
    opt
      .setName('resim-url')
      .setDescription('Geçerli bir resim linki (.png, .jpg)')
      .setRequired(true)
  );

module.exports = {
  isim: 'background-set',
  aciklama: 'Rank kartı arkaplan resmini değiştirir.',
  alternatifler: ['bg-set', 'arkaplan'],
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const url = args[0] || (mesaj.attachments.first()?.url);

    if (!url) {
      return mesaj.reply('❌ Lütfen bir resim linki girin veya resim ekleyin. `v!background-set <link>`');
    }

    if (!url.startsWith('http') || (!url.includes('.png') && !url.includes('.jpg') && !url.includes('.jpeg') && !url.includes('.webp'))) {
      return mesaj.reply('❌ Lütfen geçerli bir `.png` veya `.jpg` resim linki kullanın.');
    }

    await kullaniciGuncelle(mesaj.author.id, mesaj.guild.id, { bgUrl: url });

    const embed = new EmbedBuilder()
      .setTitle('🖼️ Arka Plan Güncellendi')
      .setDescription('Rank kartı arka planınız başarıyla değiştirildi. Görmek için `v!rank` yazın.')
      .setImage(url)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const url = interaction.options.getString('resim-url');

    if (!url.startsWith('http') || (!url.includes('.png') && !url.includes('.jpg') && !url.includes('.jpeg') && !url.includes('.webp'))) {
      return interaction.reply({ content: '❌ Lütfen geçerli bir `.png` veya `.jpg` resim linki kullanın.', ephemeral: true });
    }

    await kullaniciGuncelle(interaction.user.id, interaction.guild.id, { bgUrl: url });

    const embed = new EmbedBuilder()
      .setTitle('🖼️ Arka Plan Güncellendi')
      .setDescription('Rank kartı arka planınız başarıyla değiştirildi. Görmek için `/rank` yazın.')
      .setImage(url)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
