// ==========================================
//  VirBot — inviteCreate Olayı
//  Yeni davetleri önbelleğe alır (davet takibi doğru çalışsın)
// ==========================================
'use strict';

const { davetEkle } = require('../modules/utils/davetTakip');

module.exports = {
  isim: 'inviteCreate',

  async calistir(client, invite) {
    davetEkle(invite, client);
  },
};
