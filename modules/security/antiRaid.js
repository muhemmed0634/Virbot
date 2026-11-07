// ==========================================
//  VirBot v6 — Anti-Raid Modülü
//  Mass-Kick, Webhook Guard & Join-Raid Koruması
// ==========================================
'use strict';

const { PermissionFlagsBits, AuditLogEvent, WebhookType } = require('discord.js');
const { logEmbed, logGonder } = require('../logger/logManager');
const { RENKLER } = require('../../config/config');
const { ayarGetir } = require('../data/dataManager');

// Anti-Raid ayarı kapalıysa (dashboard) korumalar devre dışı
function antiRaidAcik(guildId) {
  return ayarGetir(guildId)?.antiRaidAktif !== false;
}

// ─── Mass-Kick Takipçisi ───────────────────────────────────
// moderatörId → { sayac, zaman }
const kickTakip = new Map();
const KICK_SINIR = 3;
const KICK_ARALIK = 10_000; // 10 saniye

/**
 * Bir kick/ban olayında çağrılır.
 * Eğer 10sn içinde 3+ kick yapıldıysa, yapan kişinin tüm rolleri alınır.
 */
async function massKickKontrol(guild, moderatorId, client) {
  if (!moderatorId || !antiRaidAcik(guild.id)) return;
  if (moderatorId === client.user?.id) return; // Botun kendi işlemleri (anti-alt, honeypot vb.) sayılmaz
  const simdi = Date.now();
  const anahtar = `${guild.id}-${moderatorId}`;
  let veri = kickTakip.get(anahtar);

  if (!veri || simdi - veri.zaman > KICK_ARALIK) {
    veri = { sayac: 1, zaman: simdi };
  } else {
    veri.sayac++;
  }

  kickTakip.set(anahtar, veri);

  if (veri.sayac >= KICK_SINIR) {
    kickTakip.delete(anahtar);
    try {
      const uye = await guild.members.fetch(moderatorId).catch(() => null);
      if (!uye) return;

      // Bot veya sunucu sahibiyse dokunma
      if (uye.id === guild.ownerId) return;
      if (uye.user.bot) return;

      // Tüm rolleri kaldır (yönetilebilir olanları)
      const roller = uye.roles.cache.filter(r => r.id !== guild.roles.everyone.id && !r.managed);
      for (const [, rol] of roller) {
        await uye.roles.remove(rol, 'VirBot v6 — Mass-Kick / Anti-Raid otomatik koruma').catch(() => {});
      }

      // DM uyarısı
      await uye.send('⚠️ **VirBot v6 Güvenlik Uyarısı:** Kısa sürede çok fazla üye attığınız için rolleriniz otomatik olarak kaldırıldı. Sunucu yöneticisiyle iletişime geçin.').catch(() => {});

      // Log
      const embed = logEmbed(
        '🛡️ Anti-Raid — Mass-Kick Engellendi',
        `**Moderatör:** <@${moderatorId}>\n**ID:** \`${moderatorId}\`\n**İşlem:** ${veri.sayac} kick/ban 10 saniyede tespit edildi.\n**Sonuç:** Tüm rolleri kaldırıldı.`,
        RENKLER.GUVENLIK,
      );
      await logGonder(client, guild.id, embed);
    } catch (hata) {
      console.error('[ANTİ-RAİD] Mass-kick koruma hatası:', hata.message);
    }
  }
}

// ─── Join-Raid Takipçisi ───────────────────────────────────
const joinTakip = new Map();
const JOIN_SINIR = 5;
const JOIN_ARALIK = 8_000; // 8 saniye

/**
 * Kısa sürede (8 saniyede 5+) üye girişi olduğunda raid algılar ve kickler.
 */
async function joinRaidKontrol(member, client) {
  const guild = member.guild;
  if (!antiRaidAcik(guild.id)) return false;
  const simdi = Date.now();
  let zamanlar = joinTakip.get(guild.id) || [];
  zamanlar = zamanlar.filter(t => simdi - t < JOIN_ARALIK);
  zamanlar.push(simdi);
  joinTakip.set(guild.id, zamanlar);

  if (zamanlar.length >= JOIN_SINIR) {
    await member.kick('VirBot v6 — Anti-Raid: Hızlı toplu giriş saldırısı tespit edildi').catch(() => {});

    const embed = logEmbed(
      '🚨 Anti-Raid — Toplu Giriş (Join Raid) Engellendi',
      `**Sunucu:** ${guild.name}\n` +
      `**Durum:** 8 saniye içinde ${zamanlar.length} hesap girişi tespit edildi.\n` +
      `**Atılan Üye:** ${member.user.tag} (<@${member.id}>)\n` +
      `**ID:** \`${member.id}\`\n` +
      `**Önlem:** Saldırgan hesap sunucudan atıldı.`,
      RENKLER.HATA
    );
    await logGonder(client, guild.id, embed);
    return true;
  }
  return false;
}

/**
 * İzinsiz webhook silinir.
 */
async function webhookKontrol(webhook, client) {
  try {
    const guild = webhook.guild;
    if (!guild) return;

    if (!antiRaidAcik(guild.id)) return;

    // Botun kendi webhook'ları, entegrasyon/uygulama webhook'ları ve kanal takip webhook'larına dokunma
    if (webhook.owner?.id && webhook.owner.id === client.user?.id) return;
    if (webhook.applicationId) return;
    if (webhook.type !== WebhookType.Incoming) return;

    // Oluşturanı denetim kaydından BU webhook'a göre bul
    const loglar = await guild.fetchAuditLogs({ type: AuditLogEvent.WebhookCreate, limit: 10 }).catch(() => null);
    // Denetim kaydı okunamıyorsa (yetki yok) güvenli tarafta kal: meşru webhook'u SİLME
    if (!loglar) return;
    const giris = loglar.entries.find(e => e.targetId === webhook.id);
    if (!giris) return; // Eski / bu olayla ilgisiz webhook
    const yapanId = giris.executorId;

    if (yapanId) {
      if (yapanId === client.user?.id || yapanId === guild.ownerId) return;
      const uye = await guild.members.fetch(yapanId).catch(() => null);
      const yetkili = uye?.permissions?.has(PermissionFlagsBits.ManageWebhooks);
      if (yetkili) return;
    }

    await webhook.delete('VirBot v6 — Yetkisiz webhook silindi').catch(() => {});

    const embed = logEmbed(
      '🪝 Webhook Guard — İzinsiz Webhook Silindi',
      `**Webhook Adı:** ${webhook.name}\n**Kanal:** <#${webhook.channelId}>\n**Oluşturan:** ${yapanId ? `<@${yapanId}>` : 'Bilinmiyor'}`,
      RENKLER.GUVENLIK,
    );
    if (guild) await logGonder(client, guild.id, embed);
  } catch (hata) {
    console.error('[WEBHOOK GUARD] Hata:', hata.message);
  }
}

module.exports = { massKickKontrol, joinRaidKontrol, webhookKontrol };
