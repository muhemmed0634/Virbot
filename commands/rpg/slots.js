// ==========================================
//  VirBot v5 — Slots Komutu (Zorlaşdırıldı)
//  Cooldown, Maks Bahis, House Edge,
//  Canlı animasyon, Loop modu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGetir, kullaniciGuncelle } = require('../../modules/data/dataManager');

// ─── Sabitler ────────────────────────────────────────────────
const SLOTS_COOLDOWN    = 20_000;   // 20 saniye cooldown
const MAX_BAHIS_YUZDE   = 0.20;     // Bakiyenin maks %20'si
const MUTLAK_MAX_BAHIS  = 3_000;    // Her durumda maks 3000 coin
const SLOTS_COOLDOWN_MAP = new Map();

// ─── Slot Sembolleri & Ödüller ───────────────────────────────
const SEMBOLLER = [
  { emoji: '🍒', agirlik: 30 },   // En sık
  { emoji: '🍋', agirlik: 25 },
  { emoji: '🍊', agirlik: 20 },
  { emoji: '🍇', agirlik: 15 },
  { emoji: '🌟', agirlik: 7  },
  { emoji: '💎', agirlik: 2  },   // En nadir
  { emoji: '🎰', agirlik: 1  },   // Ultra nadir - jackpot
];
const TOPLAM_AGIRLIK = SEMBOLLER.reduce((a, s) => a + s.agirlik, 0);

// Ağırlıklı rastgele sembol
function rastgeleSembol() {
  let r = Math.random() * TOPLAM_AGIRLIK;
  for (const s of SEMBOLLER) {
    r -= s.agirlik;
    if (r <= 0) return s.emoji;
  }
  return SEMBOLLER[0].emoji;
}

// ─── Kazanç Tablosu ──────────────────────────────────────────
function kazancHesapla(s1, s2, s3, bahis) {
  // Üçlü eşleşme
  if (s1 === s2 && s2 === s3) {
    if (s1 === '🎰') return { carpan: 50, mesaj: '🎰🎉 **MEGA JACKPOT!!!** 50x kazandınız!', renk: 0xFFD700 };
    if (s1 === '💎') return { carpan: 15, mesaj: '💎 **DİAMOND JACKPOT!** 15x kazandınız!', renk: 0x00B0F4 };
    if (s1 === '🌟') return { carpan: 8,  mesaj: '🌟 **STAR JACKPOT!** 8x kazandınız!',    renk: 0xFEE75C };
    if (s1 === '🍇') return { carpan: 5,  mesaj: '🍇 **Üçlü Üzüm!** 5x kazandınız!',      renk: 0xA259FF };
    if (s1 === '🍊') return { carpan: 4,  mesaj: '🍊 **Üçlü Portakal!** 4x kazandınız!',  renk: 0xFF8C00 };
    if (s1 === '🍋') return { carpan: 3,  mesaj: '🍋 **Üçlü Limon!** 3x kazandınız!',     renk: 0xFEE75C };
    if (s1 === '🍒') return { carpan: 2,  mesaj: '🍒 **Üçlü Kiraz!** 2x kazandınız!',     renk: 0xED4245 };
  }
  // İkili eşleşme
  if (s1 === s2 || s2 === s3 || s1 === s3) {
    return { carpan: 1.2, mesaj: '✨ **İkili Eşleşme!** 1.2x kazandınız!', renk: RENKLER.BILGI };
  }
  // Özel: tüm farklı + 🍒 var
  if ([s1, s2, s3].includes('🍒') && s1 !== s2 && s2 !== s3 && s1 !== s3) {
    return { carpan: 0.5, mesaj: '🍒 **Kiraz Tesellisi!** %50 geri kazandınız!', renk: RENKLER.UYARI };
  }
  return { carpan: 0, mesaj: '😔 **Kaybettiniz!** Şansınız bir dahaki sefere!', renk: RENKLER.HATA };
}

// ─── Ana Fonksiyon ────────────────────────────────────────────
async function slotOyna(userId, guildId, bahis) {
  // Cooldown
  const cdKey = `${userId}-${guildId}`;
  const son = SLOTS_COOLDOWN_MAP.get(cdKey) || 0;
  const kdb = Date.now() - son;
  if (kdb < SLOTS_COOLDOWN) {
    const kalan = Math.ceil((SLOTS_COOLDOWN - kdb) / 1000);
    return { hata: `⏳ Slot cooldown! **${kalan}** saniye sonra tekrar dene.` };
  }

  const kullanici = await kullaniciGetir(userId, guildId);

  if (kullanici.coins <= 0) return { hata: '💸 Bakiyen **0** 🪙! Önce `/daily` ile günlük ödülünü al.' };
  if (bahis <= 0) return { hata: '❌ Bahis 0\'dan büyük olmalı.' };
  if (kullanici.coins < bahis) return { hata: `❌ Yeterli coinin yok. Bakiye: **${kullanici.coins} 🪙**` };

  const maksBahis = Math.min(Math.floor(kullanici.coins * MAX_BAHIS_YUZDE), MUTLAK_MAX_BAHIS);
  if (bahis > maksBahis) {
    return {
      hata: `🎰 Çok yüksek bahis! Maks: **${maksBahis} 🪙** (bakiyenin %20 veya 3000 coin).\nBakiyen: **${kullanici.coins} 🪙**`
    };
  }

  // Spin
  const s1 = rastgeleSembol();
  const s2 = rastgeleSembol();
  const s3 = rastgeleSembol();

  const { carpan, mesaj, renk } = kazancHesapla(s1, s2, s3, bahis);
  const kazanc    = Math.floor(bahis * carpan);
  const fark      = kazanc - bahis;
  const yeniCoin  = Math.max(0, kullanici.coins + fark);

  await kullaniciGuncelle(userId, guildId, { coins: yeniCoin });
  SLOTS_COOLDOWN_MAP.set(cdKey, Date.now());

  return { s1, s2, s3, bahis, kazanc, fark, yeniCoin, mesaj, renk, maksBahis, carpan };
}

// ─── Embed Oluştur ────────────────────────────────────────────
function embedOlustur(res, kullaniciAdi) {
  const kazandi = res.fark > 0;
  const kazandiEsit = res.fark === 0 && res.carpan > 0;

  return new EmbedBuilder()
    .setTitle('🎰 Slot Makinesi')
    .setDescription(
      `╔══════════════════╗\n` +
      `║  ${res.s1}  ┃  ${res.s2}  ┃  ${res.s3}  ║\n` +
      `╚══════════════════╝\n\n` +
      `${res.mesaj}\n\n` +
      `💰 **Bahis:** ${res.bahis} 🪙\n` +
      `${kazandi ? `✅ **Kazanılan:** +${res.fark} 🪙` : kazandiEsit ? `➡️ **Geri alınan:** ${res.kazanc} 🪙` : `❌ **Kaybedilen:** ${res.bahis} 🪙`}\n` +
      `🏦 **Bakiye:** ${res.yeniCoin} 🪙\n\n` +
      `📊 Maks Bahis: **${res.maksBahis} 🪙** _(bakiyenin %20)_`
    )
    .setColor(res.renk)
    .setFooter({ text: `${kullaniciAdi} • 20sn cooldown • House Edge aktif` })
    .setTimestamp();
}

// ─── Slash Data ───────────────────────────────────────────────
const slashData = new SlashCommandBuilder()
  .setName('slots')
  .setDescription('🎰 Slot makinesi! (20sn cooldown, maks %20 bakiye)')
  .addIntegerOption(opt =>
    opt
      .setName('bahis')
      .setDescription('Bahis miktarı (maks bakiyenin %20 veya 3000 coin)')
      .setMinValue(1)
      .setRequired(true)
  );

module.exports = {
  isim: 'slots',
  aciklama: '🎰 Slot makinesi oynarsın. (20sn cooldown, maks %20 bakiye)',
  alternatifler: ['slot', 'kumar'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix ──────────────────────────────────────────────
  async calistir(client, mesaj, args) {
    const bahis = parseInt(args[0]);
    if (isNaN(bahis) || bahis <= 0) {
      return mesaj.reply(
        '❌ Kullanım: `v!slots <bahis>`\n' +
        '⚠️ **Kurallar:** 20 saniye cooldown | Maks: bakiyenin %20 (en fazla 3000) | House edge aktif\n' +
        '🎰 **Kazanç tablosu:** 🍒×3=2x | 🍋×3=3x | 🍊×3=4x | 🍇×3=5x | 🌟×3=8x | 💎×3=15x | 🎰×3=50x'
      );
    }
    const res = await slotOyna(mesaj.author.id, mesaj.guild.id, bahis);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [embedOlustur(res, mesaj.author.username)] });
  },

  // ─── Slash ───────────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const bahis = interaction.options.getInteger('bahis');
    const res = await slotOyna(interaction.user.id, interaction.guildId, bahis);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [embedOlustur(res, interaction.user.username)] });
  },
};
