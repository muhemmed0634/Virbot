// ==========================================
//  VirBot — v!sayac-sifirla Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'sayac-sifirla',
  aciklama: 'Sayaç sistemini kapatır ve sıfırlar.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    await guildGuncelle(mesaj.guild.id, {
      sayacKanalId: null,
      sayacHedef: 0
    });

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Sayaç Sıfırlandı')
      .setDescription('Sayaç sistemi başarıyla kapatıldı ve veriler temizlendi.')
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🗑️ Sayaç Kapatıldı',
      `**Yetkili:** ${mesaj.author.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
