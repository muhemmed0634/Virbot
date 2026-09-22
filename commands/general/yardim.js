// ==========================================
//  VirBot — v!yardim Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');

module.exports = {
  isim: 'yardim',
  aciklama: 'Botun komutlarını listeler.',
  alternatifler: ['help', 'yardım'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 VirBot v2 — Yardım Menüsü')
      .setDescription('Aşağıda botun sistemleri ve temel komutları listelenmiştir. Ön ekiniz: `v!`')
      .setColor(RENKLER.BIRINCIL)
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { 
          name: '🛡️ Güvenlik ve Kurulum (Sadece Yetkililer)', 
          value: '`v!anti-alt-kur [aç/kapat]` - Yeni hesap koruması\n' +
                 '`v!honeypot-kur #kanal` - Bot tuzağı (Spam koruma)\n' +
                 '`v!verify-kur @rol #kanal` - Doğrulama sistemi\n' +
                 '`v!log #kanal` - Log kanalı\n' +
                 '`v!backup-al` / `v!backup-restore` - Sunucu yedekleme'
        },
        { 
          name: '🔨 Moderasyon', 
          value: '`v!ban @üye [sebep]`\n`v!unban ID`\n`v!mute @üye [sebep]`\n`v!unmute @üye`\n`v!warn @üye [sebep]`'
        },
        { 
          name: '⚔️ RPG & Ekonomi', 
          value: '`v!hunt` - Avlanma\n' +
                 '`v!zoo` - Hayvanat Bahçesi ve Envanter\n' +
                 '`v!sell` - Hayvan satışı\n' +
                 '`v!battle @üye` - Düello yapma\n' +
                 '`v!slots` / `v!coinflip` - Kumar oyunları\n' +
                 '`v!daily` / `v!cash` / `v!give`'
        },
        { 
          name: '🌟 Seviye & Deneyim', 
          value: '`v!rank` - Seviye kartını göster\n' +
                 '`v!leaderboard` - En çok XP kasanlar\n' +
                 '`v!background-set [resim-linki]` - Arka planı değiştir'
        },
        { 
          name: '🎁 Çekiliş (Beta)', 
          value: '`v!cekilis-baslat <10m|1h vs> <kazanan> <ödül>` - Sade Beta çekiliş\n`v!reroll <mesajID>` - Yeniden kazanan çeker'
        },
        { 
          name: '🎉 Diğer / Eğlence', 
          value: '`v!ticket-kur` - Destek sistemi\n' +
                 '`v!ses-sistemi kur <kategori>` / `/ses-sistemi-kur` - Geçici ses kanalları\n' +
                 '`v!kelime-kur #kanal` - Kelime türetme oyunu\n' +
                 '`v!ai-kanal #kanal` - Gemini Yapay Zeka sohbeti'
        }
      )
      .setFooter({ text: 'VirBot v2.0 | Tam Kapsamlı Üretim Sürümü' })
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
  },
};
