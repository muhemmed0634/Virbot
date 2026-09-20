// ==========================================
//  VirBot — v!coinflip Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { coinflip } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'coinflip',
  aciklama: 'Yazı tura oynarsın.',
  alternatifler: ['cf', 'yazitura'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const bahis = parseInt(args[0]);
    const tahmin = args[1]?.toLowerCase();

    if (isNaN(bahis) || bahis <= 0 || (tahmin !== 'yazı' && tahmin !== 'tura')) {
      return mesaj.reply('❌ Kullanım: `v!coinflip <bahis> <yazı/tura>`');
    }

    const sonuc = await coinflip(mesaj.author.id, mesaj.guild.id, bahis, tahmin);

    if (sonuc.hata) {
      return mesaj.reply(sonuc.hata);
    }

    const embed = new EmbedBuilder()
      .setTitle('🪙 Yazı Tura')
      .setDescription(
        `Havaya bir bozuk para attın...\n\n` +
        `Sonuç: **${sonuc.sonuc.toUpperCase()}**\n\n` +
        `${sonuc.kazandi ? `🎉 Kazandın! (+${sonuc.bahis})` : `😔 Kaybettin! (-${sonuc.bahis})`}\n` +
        `Yeni Bakiye: **${sonuc.yeniCoin} Coin**`
      )
      .setColor(sonuc.kazandi ? RENKLER.BASARI : RENKLER.HATA);

    await mesaj.reply({ embeds: [embed] });
  },
};
