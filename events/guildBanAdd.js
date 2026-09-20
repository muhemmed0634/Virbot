// ==========================================
//  VirBot — guildBanAdd Olayı
//  Anti-Raid / Mass Kick Kontrolü
// ==========================================
'use strict';

const { massKickKontrol } = require('../modules/security/antiRaid');

module.exports = {
  isim: 'guildBanAdd',

  async calistir(client, ban) {
    const guild = ban.guild;
    
    // İşlemi kimin yaptığını bul
    const loglar = await guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(() => null); // 22 = MEMBER_BAN_ADD
    const giris = loglar?.entries?.first();
    
    if (giris && giris.target.id === ban.user.id) {
      await massKickKontrol(guild, giris.executorId, client);
    }
  },
};
