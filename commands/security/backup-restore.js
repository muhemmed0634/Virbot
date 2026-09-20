// ==========================================
//  VirBot — v!backup-restore Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { backupGetirSon, backupGeriYukle } = require('../../modules/security/backupManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'backup-restore',
  aciklama: 'Son yedeği geri yükler (roller, kanallar oluşturulur).',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const bekle = await mesaj.reply('⏳ Yedek geri yükleniyor, lütfen bekleyin...');

    try {
      const yedek = await backupGetirSon(mesaj.guild.id);

      if (!yedek) {
        return bekle.edit('❌ Bu sunucu için kayıtlı bir yedek bulunamadı. Önce `v!backup-al` kullanın.');
      }

      const tarih = new Date(yedek.tarih).toLocaleString('tr-TR');
      const sonuc = await backupGeriYukle(mesaj.guild, yedek.veri);

      const embed = new EmbedBuilder()
        .setTitle('♻️ Yedek Geri Yüklendi')
        .addFields(
          { name: '📅 Yedek Tarihi', value: tarih, inline: true },
          { name: '🎭 Oluşturulan Roller', value: `${sonuc.roller}`, inline: true },
          { name: '💬 Oluşturulan Kanallar', value: `${sonuc.kanallar}`, inline: true },
        )
        .setColor(RENKLER.BASARI)
        .setTimestamp()
        .setFooter({ text: 'VirBot — Backup Sistemi | Mevcut kanallar/roller silinmedi' });

      if (sonuc.hatalar.length > 0) {
        embed.addFields({
          name : `⚠️ Uyarılar (${sonuc.hatalar.length})`,
          value: sonuc.hatalar.slice(0, 5).join('\n').slice(0, 1024),
        });
      }

      await bekle.edit({ content: null, embeds: [embed] });

      const logEmb = logEmbed(
        '♻️ Sunucu Yedeği Geri Yüklendi',
        `**Yetkili:** ${mesaj.author.tag}\n**Yedek Tarihi:** ${tarih}\n**Oluşturulan:** ${sonuc.roller} rol, ${sonuc.kanallar} kanal`,
        RENKLER.BASARI,
      );
      await logGonder(client, mesaj.guild.id, logEmb);

    } catch (hata) {
      console.error('[BACKUP-RESTORE]', hata.message);
      await bekle.edit('❌ Geri yükleme sırasında bir hata oluştu.');
    }
  },
};
