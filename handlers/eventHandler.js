// ==========================================
//  VirBot — Olay Handler
//  events/ klasöründeki tüm olayları otomatik yükler
// ==========================================

const fs = require('fs');
const path = require('path');

function olaylariYukle(client) {
  const olayKlasoru = path.join(__dirname, '..', 'events');
  const olayDosyalari = fs.readdirSync(olayKlasoru).filter(f => f.endsWith('.js'));

  for (const dosya of olayDosyalari) {
    const olay = require(path.join(olayKlasoru, dosya));
    if (olay.isim && olay.calistir) {
      if (olay.birKere) {
        client.once(olay.isim, (...args) => olay.calistir(client, ...args));
      } else {
        client.on(olay.isim, (...args) => olay.calistir(client, ...args));
      }
      console.log(`[OLAY] ✅ ${olay.isim} yüklendi.`);
    }
  }
}

module.exports = { olaylariYukle };
