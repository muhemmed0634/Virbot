// ==========================================
//  VirBot v5 — v!coinflip / /coinflip Komutu
//  Zorlayıcı: Cooldown, Maks Bahis, House Edge,
//  Streak Sistemi, Animasyon Efekti
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGetir, kullaniciGuncelle } = require('../../modules/data/dataManager');

// ─── Sabitler ────────────────────────────────────────────────
const COINFLIP_COOLDOWN   = 15_000;       // 15 saniye cooldown
const MAX_BAHIS_YUZDE     = 0.25;         // Bakiyenin maks %25'i
const MUTLAK_MAX_BAHIS    = 5_000;        // Her durumda maks 5000 coin
const WIN_SANSE           = 0.47;         // %47 kazanma (house edge = %6)
const STREAK_BONUS_ESIK   = 3;            // 3+ streak bonus başlar
const STREAK_BONUS_CARPAN = 0.10;         // Her streak için +%10 bonus (maks %30)

// Cooldown map (in-memory)
const cfCooldown = new Map(); // `${userId}-${guildId}` → timestamp

// ─── Süre formatı ────────────────────────────────────────────
function kalan(ms) {
  const sn = Math.ceil(ms / 1000);
  return `**${sn}** saniye`;
}

// ─── Streak Bilgisi ──────────────────────────────────────────
async function streakGuncelle(userId, guildId, kazandi) {
  const kullanici = await kullaniciGetir(userId, guildId);
  const mevcutStreak = kullanici.cfStreak || 0;
  const yeniStreak   = kazandi ? mevcutStreak + 1 : 0;

  await kullaniciGuncelle(userId, guildId, { cfStreak: yeniStreak });
  return { onceki: mevcutStreak, yeni: yeniStreak };
}

// ─── Maks Bahis Hesaplama ────────────────────────────────────
function maksBahisHesapla(coins) {
  const yuzde = Math.floor(coins * MAX_BAHIS_YUZDE);
  return Math.min(yuzde, MUTLAK_MAX_BAHIS);
}

// ─── Ana Coinflip Mantığı ────────────────────────────────────
async function coinflipOyna(userId, guildId, bahis, tahmin) {
  const t = tahmin.toLowerCase().replace('yazi', 'yazı').replace('tails', 'tura').replace('heads', 'yazı');
  if (t !== 'yazı' && t !== 'tura') {
    return { hata: '❌ Tahmin **yazı** veya **tura** olmalıdır.' };
  }

  // ── Cooldown Kontrolü ──
  const cdAnahtari = `${userId}-${guildId}`;
  const sonKullanim = cfCooldown.get(cdAnahtari) || 0;
  const kdb = Date.now() - sonKullanim;
  if (kdb < COINFLIP_COOLDOWN) {
    return { hata: `⏳ Coinflip cooldown'ı! ${kalan(COINFLIP_COOLDOWN - kdb)} sonra tekrar deneyebilirsin.` };
  }

  const kullanici = await kullaniciGetir(userId, guildId);

  // ── Bakiye Kontrolleri ──
  if (kullanici.coins <= 0) {
    return { hata: '💸 Bakiyen **0** 🪙! Önce `/daily` ile günlük ödülünü al.' };
  }
  if (bahis <= 0) return { hata: '❌ Bahis 0\'dan büyük olmalı.' };
  if (kullanici.coins < bahis) {
    return { hata: `❌ Yeterli coinin yok. Bakiye: **${kullanici.coins} 🪙**` };
  }

  const maksBahis = maksBahisHesapla(kullanici.coins);
  if (bahis > maksBahis) {
    return {
      hata: `🎰 Çok yüksek bahis! Maksimum bahsin: **${maksBahis} 🪙** (bakiyenin %25 veya 5000 coin, hangisi düşükse).\n` +
            `Mevcut bakiyen: **${kullanici.coins} 🪙**`
    };
  }

  // ── Sonuç Belirle (House Edge) ──
  const sonuc   = Math.random() < 0.5 ? 'yazı' : 'tura';
  const kazandi = sonuc === t && Math.random() < WIN_SANSE / 0.5; // house edge uygula

  // Daha temiz hesap: doğrudan kazanma şansı
  const kazandiSon = (sonuc === t) ? (Math.random() < WIN_SANSE * 2) : false;

  // ── Streak Güncelle ──
  const streak = await streakGuncelle(userId, guildId, kazandiSon);

  // ── Bonus Hesapla ──
  let bonus = 0;
  let streakBonusMesaj = '';
  if (kazandiSon && streak.yeni >= STREAK_BONUS_ESIK) {
    const carpan = Math.min((streak.yeni - STREAK_BONUS_ESIK + 1) * STREAK_BONUS_CARPAN, 0.30);
    bonus = Math.floor(bahis * carpan);
    streakBonusMesaj = `\n🔥 **${streak.yeni} Streak Bonusu:** +${bonus} 🪙 (%${Math.floor(carpan * 100)})`;
  }

  // ── Coin Güncelle ──
  const kazanc   = kazandiSon ? bahis + bonus : 0;
  const kayip    = kazandiSon ? 0 : bahis;
  const yeniCoin = kullanici.coins + (kazandiSon ? bahis + bonus : -bahis);
  await kullaniciGuncelle(userId, guildId, { coins: Math.max(0, yeniCoin) });

  // ── Cooldown Kaydet ──
  cfCooldown.set(cdAnahtari, Date.now());

  return {
    sonuc: sonuc === 'yazı' ? '🪙 YAZI' : '💿 TURA',
    tahmin: t === 'yazı' ? '🪙 Yazı' : '💿 Tura',
    kazandi: kazandiSon,
    bahis,
    kazanc,
    kayip,
    bonus,
    streakBonusMesaj,
    streak: streak.yeni,
    oncekiStreak: streak.onceki,
    yeniCoin: Math.max(0, yeniCoin),
    maksBahis,
  };
}

// ─── Embed Oluştur ───────────────────────────────────────────
function embedOlustur(res, kullaniciAdi) {
  const animasyon = res.kazandi
    ? ['🌀 Para havaya fırlıyor...', '✨ Döndü döndü...', res.sonuc][2]
    : ['🌀 Para havaya fırlıyor...', '💨 Döndü döndü...', res.sonuc][2];

  const streakGostergesi = res.streak >= 2
    ? `\n🔥 Streak: **${res.streak}x** ${res.streak >= 3 ? '🔥🔥' : ''}`
    : '';

  return new EmbedBuilder()
    .setTitle(`🪙 Yazı Tura — ${res.kazandi ? '🎉 Kazandın!' : '💀 Kaybettin!'}`)
    .setDescription(
      `**Tahminin:** ${res.tahmin} → **Sonuç: ${animasyon}**\n\n` +
      `${res.kazandi
        ? `🎉 **+${res.bahis} 🪙 kazandın!**${res.streakBonusMesaj}`
        : `😔 **-${res.bahis} 🪙 kaybettin!**`
      }${streakGostergesi}\n\n` +
      `💰 Bakiye: **${res.yeniCoin} 🪙**\n` +
      `🎰 Maks Bahis: **${res.maksBahis} 🪙** _(bakiyenin %25)_`
    )
    .setColor(res.kazandi ? RENKLER.BASARI : RENKLER.HATA)
    .setFooter({ text: `${kullaniciAdi} • 15sn cooldown • House Edge %6` })
    .setTimestamp();
}

// ─── Slash Data ──────────────────────────────────────────────
const slashData = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('🪙 Yazı-tura at, bahis oyna! (15sn cooldown, maks %25 bakiye)')
  .addIntegerOption(opt =>
    opt
      .setName('bahis')
      .setDescription('Bahis miktarı (maks bakiyenin %25 veya 5000 coin)')
      .setMinValue(1)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('tahmin')
      .setDescription('Yazı mı Tura mı?')
      .setRequired(true)
      .addChoices(
        { name: '🪙 Yazı', value: 'yazı' },
        { name: '💿 Tura', value: 'tura' }
      )
  );

module.exports = {
  isim: 'coinflip',
  aciklama: '🪙 Yazı tura oynarsın. (15sn cooldown, maks %25 bakiye, house edge)',
  alternatifler: ['cf', 'yazitura'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const bahis = parseInt(args[0]);
    const tahmin = args[1]?.toLowerCase();

    if (isNaN(bahis) || bahis <= 0 || !tahmin) {
      return mesaj.reply(
        '❌ Kullanım: `v!coinflip <bahis> <yazı/tura>`\n' +
        '⚠️ **Kurallar:** 15 saniye cooldown | Maks bahis: bakiyenin %25 (en fazla 5000) | House edge: %6'
      );
    }

    const res = await coinflipOyna(mesaj.author.id, mesaj.guild.id, bahis, tahmin);
    if (res.hata) return mesaj.reply(res.hata);

    const embed = embedOlustur(res, mesaj.author.username);
    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const bahis  = interaction.options.getInteger('bahis');
    const tahmin = interaction.options.getString('tahmin');

    const res = await coinflipOyna(interaction.user.id, interaction.guildId, bahis, tahmin);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });

    const embed = embedOlustur(res, interaction.user.username);
    await interaction.reply({ embeds: [embed] });
  },
};
