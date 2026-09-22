// ==========================================
//  VirBot v2 — RPG Yöneticisi
//  Hunt, Zoo, Sell, Battle, Equip, Market, Give
// ==========================================
'use strict';

const { RPG, RENKLER } = require('../../config/config');
const { kullaniciGetir, kullaniciGuncelle } = require('../data/dataManager');
const { EmbedBuilder } = require('discord.js');

// ─── Yardımcılar ───────────────────────────────────────────
function rastgeleHayvan() {
  const sayi = Math.random() * 100;
  let toplam = 0;
  for (const [nadir, sans] of Object.entries(RPG.HAYVAN_SANSLARI)) {
    toplam += sans;
    if (sayi <= toplam) {
      const liste = RPG.HAYVANLAR[nadir];
      return {
        isim : liste[Math.floor(Math.random() * liste.length)],
        nadir,
        bonus: RPG.HAYVAN_BONUS[nadir],
      };
    }
  }
  return { isim: RPG.HAYVANLAR.COMMON[0], nadir: 'COMMON', bonus: 1 };
}

function nadirRenk(nadir) {
  const renkler = {
    COMMON   : 0xAAAAAA,
    UNCOMMON : 0x57F287,
    RARE     : 0x00B0F4,
    EPIC     : 0xA259FF,
    LEGENDARY: 0xFFAA00,
  };
  return renkler[nadir] || 0xAAAAAA;
}

function nadirYildiz(nadir) {
  return { COMMON: '⚪', UNCOMMON: '🟢', RARE: '🔵', EPIC: '🟣', LEGENDARY: '🟡' }[nadir] || '⚪';
}

// ─── EKİPMAN / MARKET HAVUZU (Min. 500 Coin) ───────────────
const SILAHLAR = [
  { id: 'pasli_kilic', isim: '🗡️ Pas Kılıç', guc: 10, fiyat: 500, tip: 'silah' },
  { id: 'demir_kilic', isim: '⚔️ Demir Kılıç', guc: 25, fiyat: 1000, tip: 'silah' },
  { id: 'sihirli_yay', isim: '🏹 Sihirli Yay', guc: 50, fiyat: 2500, tip: 'silah' },
  { id: 'ejder_mizragi', isim: '🔱 Ejder Mızrağı', guc: 90, fiyat: 5000, tip: 'silah' },
  { id: 'simsek_kilici', isim: '⚡ Şimşek Kılıcı', guc: 150, fiyat: 10000, tip: 'silah' },
];

const ZIRHLAR = [
  { id: 'deri_zirh', isim: '🛡️ Deri Zırh', guc: 10, fiyat: 500, tip: 'zirh' },
  { id: 'zincir_zirh', isim: '⚙️ Zincir Zırh', guc: 25, fiyat: 1000, tip: 'zirh' },
  { id: 'celik_zirh', isim: '🪖 Çelik Zırh', guc: 50, fiyat: 2500, tip: 'zirh' },
  { id: 'kristal_zirh', isim: '👑 Kristal Zırh', guc: 90, fiyat: 5000, tip: 'zirh' },
  { id: 'golge_zirh', isim: '🌑 Gölge Zırh', guc: 150, fiyat: 10000, tip: 'zirh' },
];

// ─── HUNT (Rastgele zırh/silah düşüşü kaldırıldı) ────────────
async function hunt(userId, guildId) {
  const kullanici = await kullaniciGetir(userId, guildId);
  const simdi = Date.now();
  const cooldown = 30_000; // 30 saniye

  if (kullanici.huntCooldown && simdi - kullanici.huntCooldown < cooldown) {
    const kalan = Math.ceil((cooldown - (simdi - kullanici.huntCooldown)) / 1000);
    return { hata: `⏳ Avlanmaya devam etmeden önce **${kalan} saniye** beklemelisiniz.` };
  }

  const hayvan = rastgeleHayvan();
  const coinKazanc = Math.floor(Math.random() * 30) + 10 + hayvan.bonus * 2;

  // Hayvanı envantere ekle
  const yeniZoo = [...kullanici.zoo, hayvan];
  const guncelleme = {
    huntCooldown: simdi,
    coins       : kullanici.coins + coinKazanc,
    zoo         : yeniZoo,
  };

  await kullaniciGuncelle(userId, guildId, guncelleme);

  return { hayvan, coinKazanc, toplamZoo: yeniZoo.length };
}

// ─── MARKET SATIN ALMA ─────────────────────────────────────
async function esyaSatinAl(userId, guildId, esyaId) {
  const tumEsyalar = [...SILAHLAR, ...ZIRHLAR];
  const esya = tumEsyalar.find(e => e.id.toLowerCase() === esyaId.toLowerCase() || e.isim.toLowerCase().includes(esyaId.toLowerCase()));

  if (!esya) {
    return { hata: '❌ Böyle bir eşya bulunamadı! Mevcut eşyaları görmek için `/market` yazın.' };
  }

  const kullanici = await kullaniciGetir(userId, guildId);
  if (kullanici.coins < esya.fiyat) {
    return { hata: `❌ Yetersiz bakiye! Bu eşyanın fiyatı **${esya.fiyat} 🪙**, senin bakiyen: **${kullanici.coins} 🪙**.` };
  }

  const guncelleme = {
    coins: kullanici.coins - esya.fiyat,
  };

  if (esya.tip === 'silah') {
    guncelleme.silah = { isim: esya.isim, guc: esya.guc };
  } else {
    guncelleme.zirh = { isim: esya.isim, guc: esya.guc };
  }

  await kullaniciGuncelle(userId, guildId, guncelleme);

  return {
    basarili: true,
    esya,
    kalanCoin: kullanici.coins - esya.fiyat,
  };
}

// ─── ZOO ───────────────────────────────────────────────────
async function zoo(userId, guildId) {
  const kullanici = await kullaniciGetir(userId, guildId);
  return {
    zoo   : kullanici.zoo || [],
    coins : kullanici.coins,
    silah : kullanici.silah,
    zirh  : kullanici.zirh,
  };
}

// ─── SELL ──────────────────────────────────────────────────
async function sell(userId, guildId, hedef) {
  const kullanici = await kullaniciGetir(userId, guildId);
  if (!kullanici.zoo || kullanici.zoo.length === 0) {
    return { hata: '🦁 Hayvanat bahçeniz boş! Önce `/hunt` ile hayvan avlayın.' };
  }

  let satilan = 0, kazanc = 0;

  if (hedef === 'hepsi' || hedef === 'all') {
    kazanc = kullanici.zoo.reduce((acc, h) => acc + (RPG.HAYVAN_BONUS[h.nadir] || 1) * 5, 0);
    satilan = kullanici.zoo.length;
    await kullaniciGuncelle(userId, guildId, { zoo: [], coins: kullanici.coins + kazanc });
  } else {
    const indeks = parseInt(hedef) - 1;
    if (isNaN(indeks) || indeks < 0 || indeks >= kullanici.zoo.length) {
      return { hata: '❌ Geçersiz hayvan numarası. `/zoo` ile listeni gör.' };
    }
    const hayvan = kullanici.zoo[indeks];
    kazanc = (RPG.HAYVAN_BONUS[hayvan.nadir] || 1) * 5;
    const yeniZoo = kullanici.zoo.filter((_, i) => i !== indeks);
    await kullaniciGuncelle(userId, guildId, { zoo: yeniZoo, coins: kullanici.coins + kazanc });
    satilan = 1;
    return { satilan, kazanc, hayvanAdi: hayvan.isim };
  }

  return { satilan, kazanc };
}

// ─── BATTLE ────────────────────────────────────────────────
async function battle(saldirganId, hedefId, guildId) {
  const s = await kullaniciGetir(saldirganId, guildId);
  const h = await kullaniciGetir(hedefId, guildId);

  // Güç hesapla: silah + zırh + hayvan bonusları
  function gucHesapla(k) {
    let guc = 10;
    if (k.silah?.guc) guc += k.silah.guc;
    if (k.zirh?.guc) guc += k.zirh.guc;
    guc += (k.zoo || []).reduce((acc, h) => acc + (RPG.HAYVAN_BONUS[h.nadir] || 1), 0);
    guc += Math.floor(Math.random() * 20); // Rastgele etken
    return guc;
  }

  const sGuc = gucHesapla(s);
  const hGuc = gucHesapla(h);

  const kazanan = sGuc >= hGuc ? saldirganId : hedefId;
  const kaybeden = kazanan === saldirganId ? hedefId : saldirganId;

  // Kazanan para alır
  const odul = Math.floor(Math.random() * 50) + 25;
  await kullaniciGuncelle(kazanan, guildId, { coins: (kazanan === saldirganId ? s.coins : h.coins) + odul });

  return {
    kazanan,
    kaybeden,
    saldirganGuc: sGuc,
    hedefGuc    : hGuc,
    odul,
  };
}

// ─── EQUIP ─────────────────────────────────────────────────
async function equip(userId, guildId, tip) {
  const kullanici = await kullaniciGetir(userId, guildId);
  if (tip === 'silah') {
    if (!kullanici.silah) return { hata: '❌ Envanterinizde silah bulunmuyor. `/market` üzerinden satın alabilirsiniz.' };
    return { ekipman: kullanici.silah, tip: 'Silah' };
  } else if (tip === 'zirh') {
    if (!kullanici.zirh) return { hata: '❌ Envanterinizde zırh bulunmuyor. `/market` üzerinden satın alabilirsiniz.' };
    return { ekipman: kullanici.zirh, tip: 'Zırh' };
  }
  return { hata: '❌ Geçersiz ekipman tipi. `silah` veya `zirh` yazın.' };
}

// ─── GIVE ──────────────────────────────────────────────────
async function give(gonderenId, hedefId, guildId, miktar) {
  const g = await kullaniciGetir(gonderenId, guildId);
  if (g.coins < miktar) return { hata: `❌ Yeterli coininiz yok. Bakiye: **${g.coins} 🪙**` };
  if (miktar <= 0) return { hata: '❌ Sıfır veya negatif coin transfer edilemez.' };

  const h = await kullaniciGetir(hedefId, guildId);
  await kullaniciGuncelle(gonderenId, guildId, { coins: g.coins - miktar });
  await kullaniciGuncelle(hedefId, guildId, { coins: h.coins + miktar });

  return { miktar, gonderenCoin: g.coins - miktar, hedefCoin: h.coins + miktar };
}

// ─── DAILY ─────────────────────────────────────────────────
async function daily(userId, guildId) {
  const kullanici = await kullaniciGetir(userId, guildId);
  const simdi = Date.now();

  if (kullanici.dailySon && simdi - kullanici.dailySon < RPG.DAILY_COOLDOWN) {
    const kalan = Math.ceil((RPG.DAILY_COOLDOWN - (simdi - kullanici.dailySon)) / 3600000);
    return { hata: `⏳ Günlük ödülünüzü zaten aldınız! **${kalan} saat** sonra tekrar deneyin.` };
  }

  const odul = RPG.DAILY_COIN;
  await kullaniciGuncelle(userId, guildId, { dailySon: simdi, coins: kullanici.coins + odul });
  return { odul, yeniMiktar: kullanici.coins + odul };
}

// ─── SLOTS ─────────────────────────────────────────────────
const SLOT_SEMBOLLERI = ['🍒', '🍋', '🍊', '🍇', '🌟', '💎', '🎰'];

async function slots(userId, guildId, bahis) {
  const kullanici = await kullaniciGetir(userId, guildId);
  if (bahis <= 0) return { hata: '❌ Bahis 0\'dan büyük olmalı.' };
  if (kullanici.coins < bahis) return { hata: `❌ Yeterli coininiz yok. Bakiye: **${kullanici.coins} 🪙**` };

  const s1 = SLOT_SEMBOLLERI[Math.floor(Math.random() * SLOT_SEMBOLLERI.length)];
  const s2 = SLOT_SEMBOLLERI[Math.floor(Math.random() * SLOT_SEMBOLLERI.length)];
  const s3 = SLOT_SEMBOLLERI[Math.floor(Math.random() * SLOT_SEMBOLLERI.length)];

  let kazanc = 0, mesaj = '';

  if (s1 === s2 && s2 === s3) {
    if (s1 === '💎') {
      kazanc = bahis * 10;
      mesaj = '💎 **JACKPOT!** 10x kazandınız!';
    } else if (s1 === '🌟') {
      kazanc = bahis * 5;
      mesaj = '🌟 **Süper!** 5x kazandınız!';
    } else {
      kazanc = bahis * 3;
      mesaj = '🎰 **Üçlü!** 3x kazandınız!';
    }
  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    kazanc = Math.floor(bahis * 1.5);
    mesaj = '✨ **İkili!** 1.5x kazandınız!';
  } else {
    kazanc = 0;
    mesaj = '😔 Kaybettiniz!';
  }

  const yeniCoin = kullanici.coins - bahis + kazanc;
  await kullaniciGuncelle(userId, guildId, { coins: yeniCoin });

  return { s1, s2, s3, bahis, kazanc, fark: kazanc - bahis, yeniCoin, mesaj };
}

// ─── COINFLIP ──────────────────────────────────────────────
async function coinflip(userId, guildId, bahis, tahmin) {
  const kullanici = await kullaniciGetir(userId, guildId);
  if (bahis <= 0) return { hata: '❌ Bahis 0\'dan büyük olmalı.' };
  if (kullanici.coins < bahis) return { hata: `❌ Yeterli coininiz yok. Bakiye: **${kullanici.coins} 🪙**` };

  const sonuc = Math.random() < 0.5 ? 'yazı' : 'tura';
  const kazandi = sonuc === tahmin.toLowerCase();
  const yeniCoin = kullanici.coins + (kazandi ? bahis : -bahis);
  await kullaniciGuncelle(userId, guildId, { coins: yeniCoin });

  return { sonuc, kazandi, bahis, yeniCoin };
}

module.exports = {
  hunt, zoo, sell, battle, equip, give, daily, slots, coinflip,
  esyaSatinAl, SILAHLAR, ZIRHLAR,
  nadirRenk, nadirYildiz, rastgeleHayvan,
};
