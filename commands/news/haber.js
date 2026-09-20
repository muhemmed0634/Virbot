// ==========================================
//  VirBot — !haber Komutu
//  DonanımHaber RSS varsayılan akışı ekler
// ==========================================

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { haberEkle } = require('../../modules/news/rssPoller');

module.exports = {
  isim: 'haber',
  alternatifler: ['haberler', 'news'],
  aciklama: 'DonanımHaber RSS akışını belirtilen kanala bağlar.',
  kullanim: '!haber #kanal',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();

    if (!kanal) {
      const embed = new EmbedBuilder()
        .setDescription('❌ Lütfen bir kanal etiketleyin!\n**Kullanım:** `!haber #kanal`')
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    const eklendi = haberEkle(mesaj.guild.id, kanal.id);

    if (!eklendi) {
      const embed = new EmbedBuilder()
        .setDescription(`⚠️ DonanımHaber akışı zaten **${kanal}** kanalına bağlı!`)
        .setColor(RENKLER.UYARI);
      return mesaj.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📰 Haber Akışı Eklendi')
      .setDescription(`DonanımHaber RSS akışı **${kanal}** kanalına bağlandı.\n\nYeni haberler her **10 dakikada** bir kontrol edilecek.`)
      .setColor(RENKLER.HABER)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
  },
};
