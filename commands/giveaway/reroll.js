// ==========================================
//  VirBot — v!reroll Komutu (Beta)
//  Çekiliş için yeni kazanan seçer
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { yenidenCek } = require('../../modules/giveaway/giveawayManager');

module.exports = {
  isim: 'reroll',
  aciklama: 'Belirtilen çekiliş için yeni kazanan seçer.',
  alternatifler: ['yenidencek', 'cekilis-yenile', 'giveaway-reroll'],
  kullanim: 'v!reroll [mesaj_id]',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const mesajId = args[0];

    if (!mesajId) {
      const embed = new EmbedBuilder()
        .setDescription('❌ Lütfen bir çekiliş mesaj ID\'si girin!\n**Kullanım:** `v!reroll [mesaj_id]`')
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    const sonuc = await yenidenCek(client, mesajId, mesaj.guild.id);

    if (!sonuc.basari) {
      const embed = new EmbedBuilder()
        .setDescription(`❌ ${sonuc.mesaj}`)
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }
  },
};
