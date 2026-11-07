// ==========================================
//  VirBot — Uzun Süreli Zamanlayıcı
//  Node.js setTimeout en fazla ~24.8 gün (2^31-1 ms) bekleyebilir;
//  daha uzun sürelerde ANINDA tetiklenir. Bu yardımcı süreyi parçalara böler.
// ==========================================
'use strict';

const MAKS_GECIKME = 2_147_483_647; // 2^31 - 1 ms

/**
 * Herhangi bir uzunluktaki süre için güvenli setTimeout.
 * @param {Function} fn - Süre dolunca çalışacak fonksiyon
 * @param {number} ms - Bekleme süresi (milisaniye)
 */
function uzunTimeout(fn, ms) {
  const bitis = Date.now() + Math.max(0, ms);
  const planla = () => {
    const kalan = bitis - Date.now();
    if (kalan <= 0) {
      Promise.resolve().then(fn).catch(err => console.error('[ZAMANLAYICI] Hata:', err?.message || err));
      return;
    }
    setTimeout(planla, Math.min(kalan, MAKS_GECIKME));
  };
  planla();
}

module.exports = { uzunTimeout, MAKS_GECIKME };
