// ==========================================
//  VirBot — !rss-ekle Komutu
//  Özel RSS kaynağı ekler
// ==========================================

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { rssEkle } = require('../../modules/news/rssPoller');

module.exports = {
  isim: 'rss-ekle',
  alternatifler: ['rssekle', 'rss-add'],
  aciklama: 'Özel bir RSS akışını belirtilen kanala bağlar.',
  kullanim: '!rss-ekle [RSS_URL] #kanal',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();
    const url = args.find(a => a.startsWith('http'));

    if (!url || !kanal) {
      const embed = new EmbedBuilder()
        .setDescription('❌ Eksik parametre!\n**Kullanım:** `!rss-ekle [RSS_URL] #kanal`\n**Örnek:** `!rss-ekle https://site.com/rss #haberler`')
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    // URL doğrulama
    try {
      new URL(url);
    } catch {
      const embed = new EmbedBuilder()
        .setDescription('❌ Geçersiz URL! Lütfen geçerli bir RSS adresi girin.')
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    const eklendi = rssEkle(mesaj.guild.id, url, kanal.id);

    if (!eklendi) {
      const embed = new EmbedBuilder()
        .setDescription(`⚠️ Bu RSS kaynağı zaten **${kanal}** kanalına bağlı!`)
        .setColor(RENKLER.UYARI);
      return mesaj.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📡 RSS Kaynağı Eklendi')
      .setDescription(`Özel RSS akışı başarıyla eklendi!\n\n**URL:** \`${url}\`\n**Kanal:** ${kanal}\n\nYeni içerikler her **10 dakikada** bir kontrol edilecek.`)
      .setColor(RENKLER.HABER)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
  },
};
