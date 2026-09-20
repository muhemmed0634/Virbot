// ==========================================
//  VirBot — v!background-set Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGuncelle } = require('../../modules/data/dataManager');

module.exports = {
  isim: 'background-set',
  aciklama: 'Rank kartı arkaplan resmini değiştirir.',
  alternatifler: ['bg-set', 'arkaplan'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const url = args[0] || (mesaj.attachments.first()?.url);

    if (!url) {
      return mesaj.reply('❌ Lütfen bir resim linki girin veya resim ekleyin. `v!background-set <link>`');
    }

    // Basit resim linki kontrolü
    if (!url.startsWith('http') || (!url.includes('.png') && !url.includes('.jpg') && !url.includes('.jpeg'))) {
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
};
