// ==========================================
//  VirBot — Komut Handler
//  commands/ klasöründeki tüm komutları otomatik yükler
// ==========================================

const fs = require('fs');
const path = require('path');

function komutlariYukle(client) {
  client.komutlar = new Map();

  const komutKlasoru = path.join(__dirname, '..', 'commands');
  const altKlasorler = fs.readdirSync(komutKlasoru);

  for (const klasor of altKlasorler) {
    const klasorYolu = path.join(komutKlasoru, klasor);
    if (!fs.statSync(klasorYolu).isDirectory()) continue;

    const komutDosyalari = fs.readdirSync(klasorYolu).filter(f => f.endsWith('.js'));

    for (const dosya of komutDosyalari) {
      const komut = require(path.join(klasorYolu, dosya));
      if (komut.isim && komut.calistir) {
        client.komutlar.set(komut.isim, komut);
        // Alternatif isimler (aliases)
        if (komut.alternatifler) {
          for (const alt of komut.alternatifler) {
            client.komutlar.set(alt, komut);
          }
        }
        console.log(`[KOMUT] ✅ ${komut.isim} yüklendi.`);
      }
    }
  }
}

module.exports = { komutlariYukle };
