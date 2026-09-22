// ==========================================
//  VirBot — v!yardim / /yardim Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER, PREFIX } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('yardim')
  .setDescription('VirBot sistem ve komut yardım menüsünü görüntüler.');

function yardimEmbedOlustur(botUser) {
  return new EmbedBuilder()
    .setTitle('🤖 VirBot v2 — Yardım Menüsü')
    .setDescription('Aşağıda botun sistemleri ve temel komutları listelenmiştir. Ön ekiniz: `v!` veya `/` (Slash komutları)')
    .setColor(RENKLER.BIRINCIL)
    .setThumbnail(botUser.displayAvatarURL())
    .addFields(
      { 
        name: '🛡️ Güvenlik ve Kurulum (Sadece Yetkililer)', 
        value: '`v!log #kanal` / `/log` - Denetim kaydı kanalı\n' +
               '`v!anti-alt-kur [aç/kapat]` - Yeni hesap koruması\n' +
               '`v!honeypot-kur #kanal` - Bot tuzağı (Spam koruma)\n' +
               '`v!verify-kur @rol [#kanal]` / `/verify-kur` - Doğrulama sistemi\n' +
               '`v!backup-al` / `v!backup-restore` - Sunucu yedekleme'
      },
      { 
        name: '🤖 Yapay Zeka & Ses Sistemleri', 
        value: '`@VirBot <mesaj>` - Bot ile doğrudan yapay zeka sohbeti\n' +
               '`v!ai-kanal #kanal` / `/ai-kanal` - Yapay zeka sohbet kanalı\n' +
               '`v!ses-sistemi kur <kategori>` / `/ses-sistemi-kur` - Geçici ses kanalları'
      },
      { 
        name: '🔨 Moderasyon', 
        value: '`v!ban @üye [sebep]`\n`v!unban ID`\n`v!mute @üye [sebep]`\n`v!unmute @üye`\n`v!warn @üye [sebep]`'
      },
      { 
        name: '🎁 Çekiliş (Beta) & Haberler', 
        value: '`v!cekilis-baslat <10m|1h vs> <kazanan> <ödül>` / `/cekilis-baslat`\n' +
               '`v!reroll <mesajID>` - Yeniden kazanan çeker\n' +
               '`v!haber #kanal` / `/haber` - DonanımHaber akışı\n' +
               '`v!rss-ekle <url> #kanal` / `/rss-ekle` - Özel RSS kaynağı'
      },
      { 
        name: '⚔️ RPG & Ekonomi', 
        value: '`v!hunt` - Avlanma | `v!zoo` - Hayvanat bahçesi | `v!sell` - Satış\n' +
               '`v!battle @üye` - Düello | `v!slots` / `v!coinflip` - Şans oyunları\n' +
               '`v!daily` / `v!cash` / `v!give` - Bakiye işlemleri'
      },
      { 
        name: '🌟 Seviye & Diğer', 
        value: '`v!rank` - Seviye kartı | `v!leaderboard` - Sıralama\n' +
               '`v!ticket-kur` / `/ticket-kur` - Destek sistemi\n' +
               '`v!kelime-kur #kanal` - Kelime türetme oyunu'
      }
    )
    .setFooter({ text: 'VirBot v2.0 | Tam Kapsamlı Üretim Sürümü' })
    .setTimestamp();
}

module.exports = {
  isim: 'yardim',
  aciklama: 'Botun komutlarını listeler.',
  alternatifler: ['help', 'yardım'],
  adminGerekli: false,
  slashData,

  async calistir(client, mesaj, args) {
    const embed = yardimEmbedOlustur(client.user);
    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const embed = yardimEmbedOlustur(client.user);
    await interaction.reply({ embeds: [embed] });
  },
};
