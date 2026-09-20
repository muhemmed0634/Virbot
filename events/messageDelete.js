// ==========================================
//  VirBot — Mesaj Silme Olayı (Log)
// ==========================================
'use strict';

const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { RENKLER } = require('../config/config');

module.exports = {
  isim: 'messageDelete',

  async calistir(client, mesaj) {
    if (!mesaj.guild) return;
    if (mesaj.author?.bot) return;
    if (!mesaj.content) return;

    const logEmb = logEmbed(
      '🗑️ Mesaj Silindi',
      `**Kullanıcı:** ${mesaj.author?.tag || 'Bilinmiyor'} (<@${mesaj.author?.id}>)\n**Kanal:** <#${mesaj.channelId}>\n**İçerik:**\n\`\`\`${mesaj.content.slice(0, 1000)}\`\`\``,
      RENKLER.UYARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
