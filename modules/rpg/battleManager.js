// ==========================================
//  VirBot v6 — Battle (PvP Savaş) Yöneticisi
//  Kullanıcı vs Kullanıcı, ekipman tabanlı
// ==========================================
'use strict';

const User = require('../../database/models/User');
const { kullaniciGetir, coinDegistir } = require('../data/dataManager');

// ─── Sabitler ─────────────────────────────────────────────
const BATTLE_COOLDOWN   = 60_000;       // 60 saniye cooldown
const KABUL_SURESI      = 30_000;       // Rakip 30 saniyede kabul etmeli
const MIN_BAHIS         = 10;
const MAKS_BAHIS        = 5_000;
const MAKS_BAHIS_YUZDE  = 0.30;        // Bakiyenin maks %30'u

// Aktif meydan okumalar: challengerId-guildId → { hedefId, bahis, zaman }
const aktifMeydan = new Map();
// Cooldown map: userId-guildId → timestamp
const battleCooldown = new Map();

// ─── Yardımcılar ──────────────────────────────────────────
function ekipmanGucu(kullanici) {
  return (kullanici?.silah?.guc || 0) + (kullanici?.zirh?.guc || 0);
}

/**
 * İki oyuncu arasındaki savaşı simüle eder.
 * Ekipman gücü atakta (silah) ve savunmada (zırh) belirleyicidir.
 * Her raund için bir dice atılır; hasar = temel + silah bonusu − rakip zırh bonusu.
 * Şans unsuru vardır: zayıf ekipman oyuncu da kazanabilir (%10-%30 upset şansı).
 *
 * @returns {{ kazanan, kaybeden, raunlar, kazananHP, kaybRP }}
 */
function savasSimule(oyuncu1, oyuncu2) {
  const MAKS_HP = 100;
  let hp1 = MAKS_HP;
  let hp2 = MAKS_HP;
  const raunlar = [];

  // Silah gücü atağa, zırh gücü savunmaya etki eder
  const silah1 = oyuncu1.silah?.guc || 0;
  const silah2 = oyuncu2.silah?.guc || 0;
  const zirh1  = oyuncu1.zirh?.guc  || 0;
  const zirh2  = oyuncu2.zirh?.guc  || 0;

  for (let raund = 1; raund <= 5; raund++) {
    // Oyuncu 1'in saldırısı
    const atakGucBase1   = 8 + Math.floor(silah1 * 0.25);
    const savunmaBase2   = Math.floor(zirh2 * 0.18);
    const rastgele1      = Math.floor(Math.random() * 10) + 1;    // 1–10
    const kritik1        = Math.random() < 0.10 + silah1 * 0.001; // %10 + ekipman
    let hasar1           = Math.max(1, atakGucBase1 + rastgele1 - savunmaBase2);
    if (kritik1) hasar1  = Math.floor(hasar1 * 1.8);
    hp2 = Math.max(0, hp2 - hasar1);

    // Oyuncu 2'nin saldırısı
    const atakGucBase2   = 8 + Math.floor(silah2 * 0.25);
    const savunmaBase1   = Math.floor(zirh1 * 0.18);
    const rastgele2      = Math.floor(Math.random() * 10) + 1;
    const kritik2        = Math.random() < 0.10 + silah2 * 0.001;
    let hasar2           = Math.max(1, atakGucBase2 + rastgele2 - savunmaBase1);
    if (kritik2) hasar2  = Math.floor(hasar2 * 1.8);
    hp1 = Math.max(0, hp1 - hasar2);

    raunlar.push({
      raund,
      hasar1, kritik1, hp1,
      hasar2, kritik2, hp2,
    });

    if (hp1 <= 0 || hp2 <= 0) break;
  }

  // Beraberlik → HP'si yüksek olan kazanır; eşitse şans
  let kazanan, kaybeden;
  if (hp1 > hp2) {
    kazanan  = oyuncu1;
    kaybeden = oyuncu2;
  } else if (hp2 > hp1) {
    kazanan  = oyuncu2;
    kaybeden = oyuncu1;
  } else {
    // Tam eşitlik: ekipman gücü fazla olan önce kazanır
    const g1 = ekipmanGucu(oyuncu1);
    const g2 = ekipmanGucu(oyuncu2);
    if (g1 >= g2) { kazanan = oyuncu1; kaybeden = oyuncu2; }
    else           { kazanan = oyuncu2; kaybeden = oyuncu1; }
  }

  return {
    kazanan,
    kaybeden,
    raunlar,
    kazananHP: kazanan === oyuncu1 ? hp1 : hp2,
    kaybedenHP: kaybeden === oyuncu1 ? hp1 : hp2,
  };
}

// ─── Meydan Okuma Başlat ──────────────────────────────────
/**
 * Challenger, hedef kullanıcıya meydan okur.
 * @returns {{ basarili, anahtar } | { hata }}
 */
async function meydanOku(challengerId, hedefId, guildId, bahis) {
  // Self-challenge engeli
  if (challengerId === hedefId) {
    return { hata: '❌ Kendinle savaşamazsın!' };
  }

  // Bahis doğrulama
  if (!Number.isInteger(bahis) || bahis < MIN_BAHIS) {
    return { hata: `❌ Minimum bahis **${MIN_BAHIS} 🪙** olmalı.` };
  }
  if (bahis > MAKS_BAHIS) {
    return { hata: `❌ Maksimum bahis **${MAKS_BAHIS} 🪙**.` };
  }

  // Cooldown
  const cdKey = `${challengerId}-${guildId}`;
  const sonBattle = battleCooldown.get(cdKey) || 0;
  const gecen = Date.now() - sonBattle;
  if (gecen < BATTLE_COOLDOWN) {
    const kalan = Math.ceil((BATTLE_COOLDOWN - gecen) / 1000);
    return { hata: `⏳ Battle cooldown! **${kalan}** saniye sonra tekrar dene.` };
  }

  // Bakiye kontrolü: challenger
  const challenger = await kullaniciGetir(challengerId, guildId);
  const maksBahis = Math.min(Math.floor(challenger.coins * MAKS_BAHIS_YUZDE), MAKS_BAHIS);
  if (challenger.coins < bahis) {
    return { hata: `❌ Yetersiz bakiye! Bakiyen: **${challenger.coins} 🪙**, bahis: **${bahis} 🪙**` };
  }
  if (bahis > maksBahis && maksBahis < MAKS_BAHIS) {
    return { hata: `❌ Çok yüksek bahis! Maks: **${maksBahis} 🪙** (bakiyenin %30 veya 5000 coin).\nBakiyen: **${challenger.coins} 🪙**` };
  }

  // Aktif meydan okuma zaten var mı?
  const anahtarMevcut = `${challengerId}-${guildId}`;
  if (aktifMeydan.has(anahtarMevcut)) {
    return { hata: '⚔️ Zaten bekleyen bir meydan okuman var! Önce o tamamlansın veya süresi dolsun.' };
  }

  // Kaydedilen meydan okumanın süresi 30 sn sonra otomatik silinir
  const timeout = setTimeout(() => aktifMeydan.delete(anahtarMevcut), KABUL_SURESI);

  aktifMeydan.set(anahtarMevcut, {
    hedefId,
    bahis,
    zaman: Date.now(),
    timeout,
  });

  return { basarili: true, anahtar: anahtarMevcut, kabul_suresi: KABUL_SURESI / 1000 };
}

// ─── Meydan Okumayı Kabul Et & Savaş ─────────────────────
/**
 * Hedef kullanıcı meydan okumayı kabul edince çağrılır.
 * @returns {{ sonuc } | { hata }}
 */
async function meydanKabul(challengerId, hedefId, guildId) {
  const anahtar = `${challengerId}-${guildId}`;
  const meydan  = aktifMeydan.get(anahtar);

  if (!meydan) {
    return { hata: '❌ Sana yönelik bekleyen bir meydan okuma yok (ya da süresi doldu).' };
  }
  if (meydan.hedefId !== hedefId) {
    return { hata: '❌ Bu meydan okuma sana yönelik değil.' };
  }
  if (Date.now() - meydan.zaman > KABUL_SURESI) {
    clearTimeout(meydan.timeout);
    aktifMeydan.delete(anahtar);
    return { hata: '⏰ Meydan okuma süresi doldu (30 saniye).' };
  }

  const { bahis } = meydan;
  clearTimeout(meydan.timeout);
  aktifMeydan.delete(anahtar);

  // Bakiye kontrolleri
  const [challUser, hedefUser] = await Promise.all([
    kullaniciGetir(challengerId, guildId),
    kullaniciGetir(hedefId, guildId),
  ]);

  if (challUser.coins < bahis) {
    return { hata: `❌ Meydan okuyan yeterli coini artık yok! (Bakiye: **${challUser.coins} 🪙**)` };
  }
  if (hedefUser.coins < bahis) {
    return { hata: `❌ Yeterli coinin yok! Bahis: **${bahis} 🪙**, Bakiyen: **${hedefUser.coins} 🪙**` };
  }

  // Savaş simülasyonu
  const sonuc = savasSimule(
    { ...challUser.toObject(), userId: challengerId },
    { ...hedefUser.toObject(), userId: hedefId }
  );

  const kazananId  = sonuc.kazanan.userId;
  const kaybedenId = sonuc.kaybeden.userId;

  // Atomik coin transferi: önce ikisinden düş, sonra kazanana iki katını ekle
  const [challDus, hedefDus] = await Promise.all([
    coinDegistir(challengerId, guildId, -bahis),
    coinDegistir(hedefId, guildId, -bahis),
  ]);

  if (!challDus || !hedefDus) {
    // Biri başarısız olduysa iade et
    if (challDus) await coinDegistir(challengerId, guildId, bahis);
    if (hedefDus) await coinDegistir(hedefId, guildId, bahis);
    return { hata: '❌ Coin transferi sırasında hata oluştu, bahisler iade edildi.' };
  }

  // Kazanana toplam pot öde
  const kazananSonuc = await coinDegistir(kazananId, guildId, bahis * 2);

  // Cooldown'ları ayarla (her iki oyuncu için)
  battleCooldown.set(`${challengerId}-${guildId}`, Date.now());
  battleCooldown.set(`${hedefId}-${guildId}`, Date.now());

  return {
    sonuc: {
      ...sonuc,
      kazananId,
      kaybedenId,
      bahis,
      pot: bahis * 2,
      kazananYeniBakiye: kazananSonuc?.coins ?? 0,
      challUser,
      hedefUser,
    },
  };
}

// ─── Meydan Okumayı Reddet / İptal ────────────────────────
function meydanReddet(challengerId, hedefId, guildId) {
  const anahtar = `${challengerId}-${guildId}`;
  const meydan  = aktifMeydan.get(anahtar);
  if (!meydan) return false;
  if (meydan.hedefId !== hedefId && hedefId !== challengerId) return false; // Sadece hedef veya challenger iptal edebilir
  clearTimeout(meydan.timeout);
  aktifMeydan.delete(anahtar);
  return true;
}

module.exports = {
  meydanOku,
  meydanKabul,
  meydanReddet,
  aktifMeydan,
  KABUL_SURESI,
  MIN_BAHIS,
  MAKS_BAHIS,
};
