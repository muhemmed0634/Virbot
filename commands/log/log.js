// ==========================================
//  VirBot — v!log Komutu
//  Log kanalını ayarlar
// ==========================================

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle, ayarGetir } = require('../../modules/data/dataManager');
const { logGonder, logEmbed } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'log',
  aciklama: 'Bot loglarının gönderileceği kanalı ayarlar.',
  kullanim: 'v!log #kanal',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();

    if (!kanal) {
      // Mevcut log kanalını göster
      const mevcut = ayarGetir(mesaj.guild.id);
      const embed = new EmbedBuilder()
        .setTitle('📋 Log Sistemi')
        .setDescription(
          mevcut?.logKanalId
            ? `✅ Mevcut log kanalı: <#${mevcut.logKanalId}>\n\nDeğiştirmek için: \`v!log #yeni-kanal\``
            : `❌ Henüz bir log kanalı ayarlanmamış.\n**Kullanım:** \`v!log #kanal\``
        )
        .setColor(mevcut?.logKanalId ? RENKLER.BASARI : RENKLER.UYARI);
      return mesaj.reply({ embeds: [embed] });
    }

    await guildGuncelle(mesaj.guild.id, { logKanalId: kanal.id });

    const embed = new EmbedBuilder()
      .setTitle('✅ Log Kanalı Ayarlandı')
      .setDescription(
        `Tüm bot logları artık **${kanal}** kanalına gönderilecek.\n\n**Takip edilecek olaylar:**\n` +
        `🛡️ Anti-Raid ve Güvenlik Uyarıları\n` +
        `🎫 Ticket açılma/kapanma ve transkriptler\n` +
        `🎭 Rol güncellemeleri\n` +
        `🍯 Honeypot yakalamaları\n` +
        `⚠️ Komut hataları ve genel uyarılar`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });

    // Test log mesajı
    const testLog = logEmbed(
      'Log Sistemi Aktif',
      `✅ VirBot log sistemi bu kanala başarıyla bağlandı!\n\n**Ayarlayan:** ${mesaj.author.tag}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, testLog);
  },
};
