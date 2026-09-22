// ==========================================
//  VirBot — Mesaj Düzenleme Olayı (v2)
//  Auto-Mod (Karaliste / Spam) & Log
// ==========================================
'use strict';

const { yetkiliMi } = require('../modules/permissions/permCheck');
const { mesajKontrol, ihlalMetni } = require('../modules/security/antiSpam');
const { ayarGetir } = require('../modules/data/dataManager');
const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { RENKLER } = require('../config/config');

module.exports = {
  isim: 'messageUpdate',

  async calistir(client, oldMessage, newMessage) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const ayarlar = ayarGetir(newMessage.guild.id);

    // Auto-Mod Kontrolü (Yetkililer hariç)
    const member = newMessage.member || await newMessage.guild.members.fetch(newMessage.author.id).catch(() => null);
    if (!yetkiliMi(member)) {
      const ihlal = mesajKontrol(newMessage, ayarlar);
      if (ihlal) {
        if (newMessage.deletable) await newMessage.delete().catch(() => {});
        const uyari = await newMessage.channel.send(`<@${newMessage.author.id}>, ${ihlalMetni(ihlal)} (Düzenleme tespit edildi)`);
        setTimeout(() => uyari.delete().catch(() => {}), 5000);
        return;
      }
    }

    // Log Kanalı Bildirimi
    if (oldMessage.content && newMessage.content) {
      const logEmb = logEmbed(
        '✏️ Mesaj Düzenlendi',
        `**Kullanıcı:** ${newMessage.author.tag} (<@${newMessage.author.id}>)\n` +
        `**Kanal:** <#${newMessage.channelId}>\n\n` +
        `**Eski Mesaj:**\n\`\`\`${oldMessage.content.slice(0, 450)}\`\`\`\n` +
        `**Yeni Mesaj:**\n\`\`\`${newMessage.content.slice(0, 450)}\`\`\``,
        RENKLER.BILGI,
      );
      await logGonder(client, newMessage.guild.id, logEmb);
    }
  },
};
