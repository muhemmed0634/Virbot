// ==========================================
//  VirBot v6 — guildBanAdd Olayı
//  Ban Logu & Anti-Raid / Mass Kick Kontrolü
// ==========================================
'use strict';

const { massKickKontrol } = require('../modules/security/antiRaid');
const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { RENKLER } = require('../config/config');

module.exports = {
  isim: 'guildBanAdd',

  async calistir(client, ban) {
    const guild = ban.guild;

    // İşlemi kimin yaptığını bul
    const loglar = await guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(() => null); // 22 = MEMBER_BAN_ADD
    const giris = loglar?.entries?.first();

    const yetkili = giris?.executor;
    const sebep = giris?.reason || ban.reason || 'Belirtilmedi';

    if (giris && giris.target?.id === ban.user.id) {
      await massKickKontrol(guild, giris.executorId, client);
    }

    // Ban Logu (Kullanıcı ID açıkça belirtilir)
    const logEmb = logEmbed(
      '🔨 Kullanıcı Yasaklandı (Ban)',
      `**Kullanıcı:** ${ban.user.tag} (<@${ban.user.id}>)\n` +
      `**ID:** \`${ban.user.id}\`\n` +
      `**Yasaklayan:** ${yetkili ? `${yetkili.tag} (<@${yetkili.id}>)` : 'Bilinmiyor'}\n` +
      `**Sebep:** ${sebep}`,
      RENKLER.HATA
    );
    await logGonder(client, guild.id, logEmb);
  },
};
