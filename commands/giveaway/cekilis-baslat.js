// ==========================================
//  VirBot — v!cekilis-baslat Komutu (Beta)
// ==========================================
'use strict';

const { cekilisBaslat, sureyiCevir } = require('../../modules/giveaway/giveawayManager');

module.exports = {
  isim: 'cekilis-baslat',
  aciklama: 'Sadeleştirilmiş çekiliş başlatır. Örnek: v!cekilis-baslat 10m 1 Discord Nitro',
  alternatifler: ['cekilis', 'giveaway', 'cekilisbaslat'],
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    if (args.length < 3) {
      return mesaj.reply('❌ Kullanım: `v!cekilis-baslat <Süre: 10m|1h|1d> <KazananSayısı> <Ödül>`\nÖrnek: `v!cekilis-baslat 30m 1 Discord Nitro`');
    }

    const sureMs = sureyiCevir(args[0]);
    if (!sureMs) {
      return mesaj.reply('❌ Geçersiz süre formatı! Örnekler: `30s`, `10m`, `2h`, `1d`');
    }

    const kazananSayisi = parseInt(args[1], 10);
    if (isNaN(kazananSayisi) || kazananSayisi < 1) {
      return mesaj.reply('❌ Geçersiz kazanan sayısı! En az 1 olmalıdır.');
    }

    const odul = args.slice(2).join(' ').trim();
    if (!odul) {
      return mesaj.reply('❌ Lütfen verilecek ödülü belirtin!');
    }

    await mesaj.delete().catch(() => {});

    await cekilisBaslat(client, {
      kanalId: mesaj.channel.id,
      guildId: mesaj.guild.id,
      odul,
      kazananSayisi,
      sureMs,
      baslatanId: mesaj.author.id,
    });
  },
};
