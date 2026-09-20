// ==========================================
//  VirBot — v!anti-alt-kur Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER, ANTI_ALT } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'anti-alt-kur',
  aciklama: 'Anti-Alt (yeni hesap koruması) sistemini açar veya kapatır.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const durum = args[0]?.toLowerCase();

    if (durum !== 'aç' && durum !== 'kapat') {
      return mesaj.reply('❌ Kullanım: `v!anti-alt-kur aç` veya `v!anti-alt-kur kapat`');
    }

    const aktifMi = durum === 'aç';
    await guildGuncelle(mesaj.guild.id, { antiAltAktif: aktifMi });

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Anti-Alt Sistemi Güncellendi')
      .setDescription(
        `Yeni hesap koruması başarıyla **${aktifMi ? 'Aktif' : 'Pasif'}** hale getirildi.\n\n` +
        `**Hesap Yaşı Sınırı:** ${ANTI_ALT.MIN_GUN} gün\n` +
        `**İşlem:** Eğer sunucuda "${ANTI_ALT.KARANTINA_ROL}" adında bir rol varsa yeni hesaplara verilir, yoksa sunucudan atılırlar.`
      )
      .setColor(aktifMi ? RENKLER.BASARI : RENKLER.HATA)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🛡️ Anti-Alt Sistemi Değiştirildi',
      `**Yetkili:** ${mesaj.author.tag}\n**Yeni Durum:** ${aktifMi ? 'Aktif' : 'Pasif'}`,
      RENKLER.GUVENLIK,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
