// ==========================================
//  VirBot v6 — guildBanAdd Olayı
//  Ban Logu & Anti-Raid / Mass Kick Kontrolü
// ==========================================
'use strict';

const { AuditLogEvent } = require('discord.js');
const { massKickKontrol } = require('../modules/security/antiRaid');
const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { RENKLER } = require('../config/config');

module.exports = {
  isim: 'guildBanAdd',

  async calistir(client, ban) {
    const guild = ban.guild;

    // İşlemi kimin yaptığını bul
    const loglar = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 }).catch(() => null);
    // Yalnızca BU kullanıcıya ait ve yeni (15 sn) kayıt — yanlış yetkiliyi loglamayı önler
    const giris = loglar?.entries?.find(e => e.targetId === ban.user.id && Date.now() - e.createdTimestamp < 15_000);

    const yetkili = giris?.executor;
    const sebep = giris?.reason || ban.reason || 'Belirtilmedi';

    if (giris) {
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
