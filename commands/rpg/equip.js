// ==========================================
//  VirBot — v!equip Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { equip } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'equip',
  aciklama: 'Sahip olduğun zırh veya silahı kuşanırsın. (v!equip silah / v!equip zirh)',
  alternatifler: ['kusan'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const tip = args[0]?.toLowerCase();
    
    if (tip !== 'silah' && tip !== 'zirh') {
      return mesaj.reply('❌ Neyi kuşanmak istiyorsun? `v!equip silah` veya `v!equip zirh` yaz.');
    }

    const sonuc = await equip(mesaj.author.id, mesaj.guild.id, tip);

    if (sonuc.hata) {
      return mesaj.reply(sonuc.hata);
    }

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${sonuc.tip} Kuşanıldı`)
      .setDescription(`Başarıyla **${sonuc.ekipman.isim}** (Güç: +${sonuc.ekipman.guc}) kuşandın!`)
      .setColor(RENKLER.RPG);

    await mesaj.reply({ embeds: [embed] });
  },
};
