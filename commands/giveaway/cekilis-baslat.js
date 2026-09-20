// ==========================================
//  VirBot — v!cekilis-baslat Komutu
// ==========================================
'use strict';

const ms = require('ms'); // Eklenecek paket listesine not al: ms (Eğer yoksa ms yerine basic split yaparız, projede var mı bakmalı, yoksa util yazarız. 'ms' kuracağız.)
const { cekilisBaslat } = require('../../modules/giveaway/giveawayManager');

// ms string'i parse eden basit yardımcı (harici paket kurmamak için)
function sureCevir(sureStr) {
  const m = sureStr.match(/^(\d+)(s|m|h|d)$/);
  if (!m) return null;
  const val = parseInt(m[1]);
  const tip = m[2];
  if (tip === 's') return val * 1000;
  if (tip === 'm') return val * 60 * 1000;
  if (tip === 'h') return val * 60 * 60 * 1000;
  if (tip === 'd') return val * 24 * 60 * 60 * 1000;
  return null;
}

module.exports = {
  isim: 'cekilis-baslat',
  aciklama: 'Çekiliş başlatır. v!cekilis-baslat 10m 1 VIP Üyelik',
  alternatifler: ['cekilis', 'giveaway'],
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    if (args.length < 3) {
      return mesaj.reply('❌ Kullanım: `v!cekilis-baslat <Süre:10m|1h> <KazananSayısı:1> <Ödül>`');
    }

    const sureMs = sureCevir(args[0]);
    if (!sureMs) return mesaj.reply('❌ Geçersiz süre! Format: `10s`, `5m`, `2h`, `1d`');

    const kazananSayisi = parseInt(args[1]);
    if (isNaN(kazananSayisi) || kazananSayisi < 1) return mesaj.reply('❌ Geçersiz kazanan sayısı!');

    const odul = args.slice(2).join(' ');

    await mesaj.delete().catch(() => {});
    await cekilisBaslat(mesaj.channel, odul, kazananSayisi, sureMs, mesaj.author);
  },
};
