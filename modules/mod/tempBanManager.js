// ==========================================
//  VirBot — Geçici Ban Yöneticisi
//  Süreli banları veritabanında saklar; restart sonrası yeniden zamanlar.
//  (Eskiden süre yalnızca RAM'deki setTimeout'taydı → restart = kalıcı ban)
// ==========================================
'use strict';

const TempBan = require('../../database/models/TempBan');
const { uzunTimeout } = require('../utils/zamanlayici');
const { logEmbed, logGonder } = require('../logger/logManager');
const { RENKLER } = require('../../config/config');

// Aynı ban için iki zamanlayıcı kurulmasın
const planlananlar = new Set();

async function banKaldir(client, guildId, userId) {
  const anahtar = `${guildId}-${userId}`;
  planlananlar.delete(anahtar);

  const kayit = await TempBan.findOne({ guildId, userId }).lean().catch(() => null);
  if (!kayit) return; // Elle kaldırılmış
  if (kayit.bitis > Date.now() + 1000) return zamanla(client, kayit); // Süre uzatılmış
  await TempBan.deleteOne({ guildId, userId }).catch(() => {});

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  try {
    await guild.members.unban(userId, 'VirBot — Geçici ban süresi doldu');
    const emb = logEmbed(
      '⏰ Ban — Geçici Ban Kaldırıldı',
      `**Kullanıcı:** ${kayit.userTag || 'Bilinmiyor'} (\`${userId}\`)\n**Sebep:** Geçici ban süresi doldu`,
      RENKLER.BASARI,
    );
    await logGonder(client, guildId, emb);
  } catch (_) { /* Zaten kaldırılmış */ }
}

function zamanla(client, kayit) {
  const anahtar = `${kayit.guildId}-${kayit.userId}`;
  if (planlananlar.has(anahtar)) return;
  planlananlar.add(anahtar);
  uzunTimeout(() => banKaldir(client, kayit.guildId, kayit.userId), kayit.bitis - Date.now());
}

/**
 * Yeni geçici ban kaydı oluşturur ve zamanlar.
 */
async function geciciBanEkle(client, { guildId, userId, userTag, sureMs, sebep }) {
  const kayit = { guildId, userId, userTag, sebep, bitis: Date.now() + sureMs };
  await TempBan.findOneAndUpdate({ guildId, userId }, { $set: kayit }, { upsert: true });
  zamanla(client, kayit);
}

/** Elle unban yapılınca kaydı siler. */
async function geciciBanSil(guildId, userId) {
  await TempBan.deleteOne({ guildId, userId }).catch(() => {});
}

/** Bot açılışında tüm geçici banları yükler. */
async function geciciBanlariYukle(client) {
  const kayitlar = await TempBan.find({}).lean();
  for (const k of kayitlar) zamanla(client, k);
  if (kayitlar.length) console.log(`[BAN] ${kayitlar.length} geçici ban yeniden zamanlandı.`);
}

module.exports = { geciciBanEkle, geciciBanSil, geciciBanlariYukle };
