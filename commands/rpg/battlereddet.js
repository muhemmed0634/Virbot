// ==========================================
//  VirBot v6 — v!battlereddet Komutu
//  (Battle sisteminin reddet kısayolu)
// ==========================================
'use strict';

const { meydanReddet } = require('../../modules/rpg/battleManager');

module.exports = {
  isim: 'battlereddet',
  aciklama: 'Gelen battle meydan okumasını reddedersin.',
  alternatifler: ['breddet', 'savaşreddet'],
  adminGerekli: false,
  rpgKomutu: true,

  async calistir(client, mesaj, args) {
    const challUye = mesaj.mentions.members.first();
    if (!challUye) {
      return mesaj.reply(
        '❌ Kullanım: `v!battlereddet @meydan_okuyan`\n' +
        'Örnek: `v!battlereddet @Ahmet`'
      );
    }

    const iptal = meydanReddet(challUye.id, mesaj.author.id, mesaj.guild.id);
    if (!iptal) {
      return mesaj.reply('❌ Sana yönelik bekleyen bir meydan okuma bulunamadı.');
    }

    await mesaj.reply(
      `🚫 <@${mesaj.author.id}>, <@${challUye.id}>'nin meydan okumasını reddetti.`
    );
  },
};
