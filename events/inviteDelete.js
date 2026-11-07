// ==========================================
//  VirBot — inviteDelete Olayı
// ==========================================
'use strict';

const { davetSil } = require('../modules/utils/davetTakip');

module.exports = {
  isim: 'inviteDelete',

  async calistir(client, invite) {
    // Not: Tek kullanımlık davetler kullanıldığında da silinir; davetEdeniBul bunu
    // önbellekteki kayıttan yakalar. Bu yüzden silmeyi kısa bir gecikmeyle yap.
    setTimeout(() => davetSil(invite, client), 5_000).unref?.();
  },
};
