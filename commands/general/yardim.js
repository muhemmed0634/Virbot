// ==========================================
//  VirBot v6 — v!yardim / v!help / /yardim
//  Kategorili yardım menüsü (açılır menü ile gezinme)
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require('discord.js');
const { RENKLER, PREFIX } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('yardim')
  .setDescription('VirBot v6 tüm sistem ve komut yardım menüsünü görüntüler.');

// ─── Kategoriler ────────────────────────────────────────────
const KATEGORILER = [
  {
    id: 'rpg',
    emoji: '⚔️',
    ad: 'RPG & Ekonomi',
    aciklama: 'Tüm üyeler kullanabilir',
    komutlar: [
      ['hunt', 'Hayvan avlar (ekipman gücü nadir şansı ve kazancı artırır)'],
      ['zoo', 'Hayvanat bahçesi, ekipman gücü ve özet'],
      ['sell <no|hepsi|rare...>', 'Hayvan satar (numara, hepsi veya nadirlik)'],
      ['market [satin-al <kod>]', 'Silah & zırh mağazası'],
      ['equip <silah|zirh>', 'Kuşanılan ekipmanı gösterir'],
      ['daily', 'Günlük ödül — üst üste alırsan seri bonusu (maks +%70)'],
      ['cash [@üye]', 'Bakiye görüntüler'],
      ['give @üye <miktar>', 'Coin gönderir'],
      ['zenginler', 'En zengin 10 üye'],
      ['slots <bahis>', 'Slot makinesi'],
      ['coinflip <bahis> <yazı|tura>', 'Yazı-tura'],
      ['blackjack <bahis>', 'Butonlu 21 (Hit / Stand / Double)'],
      ['battle @rakip <bahis>', '⚔️ Rakibe PvP meydan okur (min 10–5000 coin, bakiyenin %30\'u). Slash: `/battle meydan`'],
      ['battlekabul @challenger', 'Meydan okumayı kabul eder ve savaşı başlatır. Slash: `/battle kabul`'],
      ['battlereddet @challenger', 'Meydan okumayı reddeder. Slash: `/battle reddet`'],
    ],
  },
  {
    id: 'seviye',
    emoji: '⭐',
    ad: 'Seviye & Genel',
    aciklama: 'Seviye kartı, sıralama, bilgi komutları',
    komutlar: [
      ['rank [@üye]', 'Canvas seviye kartı'],
      ['leaderboard', 'XP sıralaması'],
      ['background-set <link>', 'Rank kartı arka planı'],
      ['sunucu-bilgi', 'Sunucu istatistikleri'],
      ['kullanici-id [@üye]', 'Kullanıcı ID ve hesap bilgisi'],
      ['mesajid', 'Yanıtlanan mesajın ID\'si'],
      ['yardim', 'Bu menü'],
    ],
  },
  {
    id: 'mod',
    emoji: '🔨',
    ad: 'Moderasyon',
    aciklama: 'Yalnızca yöneticiler',
    komutlar: [
      ['ban @üye|ID [12h|7d] [sebep]', 'Yasaklar (süreli ban restart sonrası da kalkar)'],
      ['unban <ID> [sebep]', 'Yasağı kaldırır'],
      ['kick @üye [sebep]', 'Sunucudan atar'],
      ['mute @üye [10m] [sebep]', 'Timeout uygular (maks 28 gün)'],
      ['unmute @üye', 'Timeout kaldırır'],
      ['warn @üye [sebep]', 'Uyarı verir'],
      ['uyarilar @üye [sil <no>|temizle]', 'Uyarı geçmişi / silme'],
      ['jail-kur', 'CEZALI rolü ve jail kanalı kurar'],
      ['jail-at @üye [sebep]', 'Hapse atar (roller saklanır)'],
      ['jail-kurtar @üye', 'Hapisten çıkarır, rolleri iade eder'],
      ['sil <1-100>', 'Toplu mesaj siler'],
      ['kilit / kilit-ac [#kanal]', 'Kanalı kilitler / açar'],
      ['yavas-mod <sn>', 'Yavaş mod'],
      ['nuke', 'Kanalı sıfırlar (onaylı, ayarlar korunur)'],
      ['mesaj [#kanal] <metin>', 'Bota mesaj yazdırır'],
      ['adminsend #kanal <mesaj>', '🔐 Bot sahibi: Kanala mesaj gönder. Slash: \`/adminsend\`'],
      ['level-sifirla @üye', 'Seviyeyi sıfırlar'],
    ],
  },
  {
    id: 'kurulum',
    emoji: '🛠️',
    ad: 'Kurulum & Güvenlik',
    aciklama: 'Yalnızca yöneticiler',
    komutlar: [
      ['log #kanal', 'Denetim log kanalı'],
      ['giris #kanal', 'Resimli giriş-çıkış kartları'],
      ['auto-rol [@rol]', 'Katılanlara otomatik rol'],
      ['verify-kur @rol [@alınacak] [#kanal]', 'Butonlu doğrulama paneli'],
      ['ticket-kur [#kanal]', 'Destek talebi paneli'],
      ['basvuru [#kanal]', 'Yetkili başvuru paneli'],
      ['honeypot-kur #kanal', 'Bot tuzağı kanalı'],
      ['ses-sistemi kur <kategori>', 'Join-to-Create geçici ses odaları'],
      ['sayackur <hedef> [#kanal]', 'Üye sayacı'],
      ['sayac-sifirla', 'Sayacı kapatır'],
      ['kelime-kur #kanal', 'Kelime türetme oyunu'],
      ['xp [#kanal|sifirla]', 'Seviye bildirim kanalı'],
    ],
  },
  {
    id: 'sistem',
    emoji: '🤖',
    ad: 'AI, Haber & Çekiliş',
    aciklama: 'AI herkese açık, diğerleri yönetici',
    komutlar: [
      ['@VirBot <soru>', 'Gemini AI sohbeti (kanal hafızalı; "unut" yaz → sıfırlar)'],
      ['ai-kanal #kanal', 'Tüm mesajlara AI yanıt veren kanal'],
      ['haber #kanal', 'DonanımHaber RSS akışı'],
      ['rss-ekle <url> #kanal', 'Özel RSS kaynağı'],
      ['rss-sil [no]', 'RSS kaynaklarını listeler / kaldırır'],
      ['cekilis-baslat <süre> <kazanan> <ödül>', 'Butonlu çekiliş'],
      ['cekilis-bitir <mesajId>', 'Çekilişi erken bitirir'],
      ['reroll <mesajId>', 'Yeni kazanan seçer'],
      ['ping / htop', 'Gecikme ve sistem paneli'],
    ],
  },
];

function anaEmbed(botUser) {
  return new EmbedBuilder()
    .setTitle('🤖 VirBot v6 — Yardım Menüsü')
    .setDescription(
      `**VirDormit** tarafından geliştirilmiş Türkçe Discord botu.\n` +
      `Ön ek: \`${PREFIX}\` veya \`/\` (slash komutları)\n\n` +
      `⚠️ **İzin Politikası:**\n` +
      `> • **Normal Üyeler:** RPG, seviye ve bilgi komutları\n` +
      `> • **Yöneticiler** (rolünde Administrator izni olanlar): tüm komutlar\n\n` +
      KATEGORILER.map(k => `${k.emoji} **${k.ad}** — ${k.komutlar.length} komut _(${k.aciklama})_`).join('\n') +
      `\n\n👇 Aşağıdaki menüden bir kategori seçin.`
    )
    .setColor(RENKLER.BIRINCIL)
    .setThumbnail(botUser.displayAvatarURL())
    .setFooter({ text: 'VirBot v6 • VirDormit Tarafından Geliştirilmiştir' })
    .setTimestamp();
}

function kategoriEmbed(kategori, botUser) {
  return new EmbedBuilder()
    .setTitle(`${kategori.emoji} ${kategori.ad}`)
    .setDescription(
      `_${kategori.aciklama}_\n\n` +
      kategori.komutlar.map(([kullanim, aciklama]) => {
        const onEk = kullanim.startsWith('@') ? '' : PREFIX;
        return `\`${onEk}${kullanim}\`\n└ ${aciklama}`;
      }).join('\n')
    )
    .setColor(RENKLER.BIRINCIL)
    .setThumbnail(botUser.displayAvatarURL())
    .setFooter({ text: 'Tüm komutların slash (/) sürümü de vardır.' });
}

function menu(seciliId = null, devreDisi = false) {
  return [new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('yardim_menu')
      .setPlaceholder('📂 Kategori seçin...')
      .setDisabled(devreDisi)
      .addOptions(
        { label: 'Ana Sayfa', value: 'ana', emoji: '🏠', default: seciliId === 'ana' },
        ...KATEGORILER.map(k => ({
          label: k.ad,
          value: k.id,
          emoji: k.emoji,
          description: k.aciklama.slice(0, 100),
          default: seciliId === k.id,
        }))
      )
  )];
}

/**
 * Menü mesajını dinler (yalnızca komutu kullanan kişi gezinebilir, 2 dk).
 */
function menuDinle(mesaj, kullaniciId, botUser) {
  const collector = mesaj.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120_000,
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== kullaniciId) {
      return i.reply({ content: '❌ Bu menü başkasına ait. Kendi menün için `/yardim` yaz.', ephemeral: true }).catch(() => {});
    }
    const secim = i.values[0];
    const kategori = KATEGORILER.find(k => k.id === secim);
    await i.update({
      embeds: [kategori ? kategoriEmbed(kategori, botUser) : anaEmbed(botUser)],
      components: menu(secim),
    }).catch(() => {});
  });

  collector.on('end', () => {
    mesaj.edit({ components: menu(null, true) }).catch(() => {});
  });
}

module.exports = {
  isim: 'yardim',
  aciklama: 'Botun komutlarını listeler.',
  alternatifler: ['help', 'yardım', 'komutlar'],
  adminGerekli: false,
  rpgKomutu: true, // Herkes yardım menüsünü görebilir
  slashData,
  KATEGORILER,

  async calistir(client, mesaj) {
    const yanit = await mesaj.reply({ embeds: [anaEmbed(client.user)], components: menu() });
    menuDinle(yanit, mesaj.author.id, client.user);
  },

  async slashCalistir(client, interaction) {
    await interaction.reply({ embeds: [anaEmbed(client.user)], components: menu() });
    const yanit = await interaction.fetchReply();
    menuDinle(yanit, interaction.user.id, client.user);
  },
};
