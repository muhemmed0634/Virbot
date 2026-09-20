// ==========================================
//  VirBot — v!backup-al Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { backupAl } = require('../../modules/security/backupManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'backup-al',
  aciklama: 'Sunucunun yedeğini alır (roller, kanallar).',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const bekle = await mesaj.reply('⏳ Yedek alınıyor, lütfen bekleyin...');

    try {
      const veri = await backupAl(mesaj.guild);

      const embed = new EmbedBuilder()
        .setTitle('💾 Sunucu Yedeği Alındı')
        .addFields(
          { name: '🏷️ Sunucu', value: veri.guildAdi, inline: true },
          { name: '👥 Üye Sayısı', value: `${veri.uyeSayisi}`, inline: true },
          { name: '🎭 Roller', value: `${veri.roller.length}`, inline: true },
          { name: '📁 Kategoriler', value: `${veri.kategoriler.length}`, inline: true },
          { name: '💬 Kanallar', value: `${veri.kanallar.length}`, inline: true },
          { name: '📅 Tarih', value: new Date().toLocaleString('tr-TR'), inline: true },
        )
        .setColor(RENKLER.BASARI)
        .setTimestamp()
        .setFooter({ text: 'VirBot — Backup Sistemi' });

      await bekle.edit({ content: null, embeds: [embed] });

      const logEmb = logEmbed(
        '💾 Sunucu Yedeği Alındı',
        `**Yetkili:** ${mesaj.author.tag}\n**Roller:** ${veri.roller.length}\n**Kanallar:** ${veri.kanallar.length}`,
        RENKLER.BASARI,
      );
      await logGonder(client, mesaj.guild.id, logEmb);

    } catch (hata) {
      console.error('[BACKUP-AL]', hata.message);
      await bekle.edit('❌ Yedek alınırken bir hata oluştu.');
    }
  },
};
