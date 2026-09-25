// ==========================================
//  VirBot — v!yardim / /yardim Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER, PREFIX } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('yardim')
  .setDescription('VirBot v3 sistem ve komut yardım menüsünü görüntüler.');

function yardimEmbedOlustur(botUser) {
  return new EmbedBuilder()
    .setTitle('🤖 VirBot v3 — Yardım Menüsü')
    .setDescription('Aşağıda botun sistemleri ve tüm komutları listelenmiştir. Ön ekiniz: `v!` veya `/` (Slash komutları)')
    .setColor(RENKLER.BIRINCIL)
    .setThumbnail(botUser.displayAvatarURL())
    .addFields(
      { 
        name: '🛡️ Güvenlik ve Kurulum (Sadece Yetkililer)', 
        value: '`v!log #kanal` / `/log` - Denetim kaydı kanalı\n' +
               '`v!giris #kanal` / `/giris` - Resimli karşılama & veda kanalı\n' +
               '`v!honeypot-kur #kanal` - Bot tuzağı (Spam koruma)\n' +
               '`v!verify-kur @rol [#kanal]` / `/verify-kur` - Doğrulama sistemi'
      },
      { 
        name: '🤖 Yapay Zeka & Ses Sistemleri', 
        value: '`@VirBot <mesaj>` - Bot ile doğrudan yapay zeka sohbeti\n' +
               '`v!ai-kanal #kanal` / `/ai-kanal` - Yapay zeka sohbet kanalı\n' +
               '`v!ses-sistemi kur <kategori>` / `/ses-sistemi-kur` - Geçici ses kanalları'
      },
      { 
        name: '🔨 Moderasyon (Prefix & Slash)', 
        value: '`v!ban` / `/ban` — Kullanıcı yasaklar\n' +
               '`v!unban` / `/unban` — Yasak kaldırır\n' +
               '`v!kick` / `/kick` — Sunucudan atar\n' +
               '`v!mute` / `/mute` — Susturur (Timeout)\n' +
               '`v!unmute` / `/unmute` — Susturmayı kaldırır\n' +
               '`v!warn` / `/warn` — Resmi uyarı verir\n' +
               '`v!sil` / `/sil` — Toplu mesaj siler (1-100)\n' +
               '`v!yavas-mod` / `/yavas-mod` — Yavaş mod ayarlar\n' +
               '`v!kilit` / `/kilit` — Kanalı mesajlara kapatır\n' +
               '`v!kilit-ac` / `/kilit-ac` — Kanal kilidini açar\n' +
               '`v!nuke` / `/nuke` — Kanalı sıfırlayıp baştan açar'
      },
      { 
        name: '⚔️ RPG & Ekonomi (Prefix & Slash)', 
        value: '`v!market` / `/market` — Zırh & Silah Mağazası (500+ Coin)\n' +
               '`v!hunt` / `/hunt` — Vahşi doğada avlanma\n' +
               '`v!zoo` / `/zoo` — Hayvanat bahçesi & teçhizat\n' +
               '`v!sell` / `/sell` — Hayvanları satar\n' +
               '`v!equip` / `/equip` — Silah/zırh kuşanır\n' +
               '`v!battle` / `/battle` — Bahisli oyuncu düellosu\n' +
               '`v!slots` / `/slots` — Slot şans oyunu\n' +
               '`v!coinflip` / `/coinflip` — Yazı-tura bahsi\n' +
               '`v!daily` / `/daily` — Günlük nakit ödülü\n' +
               '`v!cash` / `/cash` — Cüzdan & banka bakiyesi\n' +
               '`v!give` / `/give` — Para transferi'
      },
      { 
        name: '🎁 Çekiliş (Beta) & Haberler', 
        value: '`v!cekilis-baslat <süre> <kazanan> <ödül>` / `/cekilis-baslat`\n' +
               '`v!reroll <mesajID>` - Yeniden kazanan çeker\n' +
               '`v!haber #kanal` / `/haber` - DonanımHaber akışı\n' +
               '`v!rss-ekle <url> #kanal` / `/rss-ekle` - Özel RSS kaynağı'
      },
      { 
        name: '🌟 Seviye, Destek & Eğlence', 
        value: '`v!rank` - Seviye kartı | `v!leaderboard` - XP sıralaması\n' +
               '`v!background-set <url>` - Seviye kartı arka planı\n' +
               '`v!ticket-kur` / `/ticket-kur` - Destek sistemi paneli\n' +
               '`v!sayackur #kanal <hedef>` / `v!sayac-sifirla` - Giriş sayacı\n' +
               '`v!kelime-kur #kanal` - Kelime oyunu'
      }
    )
    .setFooter({ text: 'VirBot v3.0 | Tam Kapsamlı Üretim Sürümü' })
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
