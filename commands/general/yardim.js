// ==========================================
//  VirBot v6 — v!yardim / v!help / /yardim
//  Tam Kapsamlı Sistem & Komut Listesi
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER, PREFIX } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('yardim')
  .setDescription('VirBot v6 tüm sistem ve komut yardım menüsünü görüntüler.');

function yardimEmbedOlustur(botUser) {
  return new EmbedBuilder()
    .setTitle('🤖 VirBot v6 — Kapsamlı Yardım & Komut Menüsü')
    .setDescription(
      `**VirDormit** tarafından geliştirilmiş ultra gelişmiş Discord botu.\n` +
      `Ön ek: \`v!\` veya \`/\` (Slash komutları)\n\n` +
      `⚠️ **İzin Politikası:**\n` +
      `> • **Normal Üyeler:** Yalnızca **RPG & Şans Oyunları** komutlarını çalıştırabilir.\n` +
      `> • **Yöneticiler (Rolünde Administrator izni açık olanlar):** Tüm moderasyon, kurulum, yönetim ve sistem komutlarına tam erişime sahiptir.`
    )
    .setColor(RENKLER.BIRINCIL || 0x5865F2)
    .setThumbnail(botUser.displayAvatarURL())
    .addFields(
      {
        name: '🛡️ Güvenlik, Kurulum & Jail (Sadece Yöneticiler)',
        value:
          '`v!log #kanal` / `/log` — Denetim log kanalı ayarlar\n' +
          '`v!jail-kur` / `/jail-kur` — CEZALI rolü ve jail kanalı kurar\n' +
          '`v!jail-at @üye [sebep]` / `/jail-at` — Kullanıcıyı hapse atar (rolleri alır)\n' +
          '`v!jail-kurtar @üye` / `/jail-kurtar` — Hapisten kurtarır, eski rollerini iade eder\n' +
          '`v!auto-rol @rol` / `/auto-rol` — Katılanlara otomatik rol verir\n' +
          '`v!giris #kanal` / `/giris` — Canvas resimli giriş-çıkış kanalı\n' +
          '`v!honeypot-kur #kanal` — Bot tuzağı kanalı (Spam/Raid koruma)\n' +
          '`v!verify-kur @rol [#kanal]` / `/verify-kur` — Butonlu doğrulama paneli'
      },
      {
        name: '🔨 Moderasyon & Yönetim (Sadece Yöneticiler)',
        value:
          '`v!ban` / `/ban` — Kullanıcı yasaklar (DM bildirimli)\n' +
          '`v!unban` / `/unban` — Yasak kaldırır\n' +
          '`v!kick` / `/kick` — Sunucudan atar\n' +
          '`v!mute` / `/mute` — Süreli susturur (Timeout)\n' +
          '`v!unmute` / `/unmute` — Susturmayı kaldırır\n' +
          '`v!warn` / `/warn` — Resmi uyarı verir\n' +
          '`v!sil <sayı>` / `/sil` — Toplu mesaj temizler (1-100)\n' +
          '`v!kilit` / `/kilit` — Kanalı mesajlara kilitler\n' +
          '`v!kilit-ac` / `/kilit-ac` — Kanal kilidini açar\n' +
          '`v!yavas-mod <sn>` / `/yavas-mod` — Yavaş mod ayarlar\n' +
          '`v!nuke` / `/nuke` — Kanalı sıfırlayıp baştan açar\n' +
          '`v!mesaj [#kanal] <metin>` / `/mesaj` — Bota mesaj yazdırır\n' +
          '`v!basvuru [#kanal]` / `/basvuru` — İnteraktif yetkili başvuru paneli kurar'
      },
      {
        name: '🤖 AI, Ses & Otomasyon',
        value:
          '`@VirBot <soru>` — Gemini Flash / Flash-Lite yapay zeka sohbeti\n' +
          '`v!ai-kanal #kanal` / `/ai-kanal` — AI sohbet kanalı\n' +
          '`v!ses-sistemi kur <Kategori>` / `/ses-sistemi-kur` — Join-to-Create geçici ses odaları\n' +
          '`v!bump-kanal #kanal` / `/bump-kanal` — 2 saatte bir otomatik Disboard bump bildirimi\n' +
          '`v!haber #kanal` / `/haber` — DonanımHaber RSS akışı\n' +
          '`v!rss-ekle <url> #kanal` / `/rss-ekle` — Özel RSS kaynağı ekler'
      },
      {
        name: '⚔️ RPG & Ekonomi & Kumar (Tüm Üyeler Erişebilir)',
        value:
          '`v!hunt` / `/hunt` — Vahşi doğada hayvan avlar\n' +
          '`v!zoo` / `/zoo` — Hayvanat bahçesi & bonuslar\n' +
          '`v!sell` / `/sell` — Avlanan hayvanları satıp coin kazanır\n' +
          '`v!market` / `/market` — Zırh & Silah mağazası\n' +
          '`v!equip` / `/equip` — Teçhizat kuşanır\n' +
          '`v!daily` / `/daily` — Günlük coin ödülü (gece yarısı sıfırlanır)\n' +
          '`v!cash` / `/cash` — Bakiye ve cüzdan görüntüleme\n' +
          '`v!give @üye <miktar>` / `/give` — Coin transferi\n' +
          '`v!slots <bahis>` / `/slots` — Slot şans oyunu (Gittikçe zorlaşan dinamik oran)\n' +
          '`v!coinflip <bahis> <yazı|tura>` / `/coinflip` — Yazı-tura bahsi\n' +
          '`v!blackjack <bahis>` / `/blackjack` — Butonlu 21 oyunu (Hit/Stand/Double)'
      },
      {
        name: '🎁 Çekiliş, Seviye & Sistem İzleme',
        value:
          '`v!cekilis-baslat <süre> <kazanan> <ödül>` / `/cekilis-baslat` — Çekiliş başlatır (Yetkili)\n' +
          '`v!cekilis-bitir <mesajId>` / `/cekilis-bitir` — Çekilişi erken sonlandırır (Yetkili)\n' +
          '`v!reroll <mesajId>` / `/reroll` — Çekilişte kazananı yeniler (Yetkili)\n' +
          '`v!rank` / `/rank` — Canvas seviye kartı\n' +
          '`v!leaderboard` / `/leaderboard` — Seviye sıralaması\n' +
          '`v!xp #kanal` / `/xp` — Seviye atlama bildirim kanalı\n' +
          '`v!ping` / `/ping` — Gecikme süreleri (Yetkili)\n' +
          '`v!htop` / `/htop` — Canlı sistem kaynak & RAM paneli (Yetkili)\n' +
          '`v!ticket-kur` / `/ticket-kur` — Destek talebi paneli (Kapatma sadece yöneticiye açık)'
      }
    )
    .setFooter({ text: 'VirBot v6 • VirDormit Tarafından Geliştirilmiştir' })
    .setTimestamp();
}

module.exports = {
  isim: 'yardim',
  aciklama: 'Botun komutlarını listeler.',
  alternatifler: ['help', 'yardım', 'komutlar'],
  adminGerekli: false,
  rpgKomutu: true, // Herkes yardım menüsünü görebilir
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
