// ==========================================
//  VirBot v6 — Anti-Raid Modülü
//  Mass-Kick, Webhook Guard & Join-Raid Koruması
// ==========================================
'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { logEmbed, logGonder } = require('../logger/logManager');
const { RENKLER } = require('../../config/config');

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
  const simdi = Date.now();
  let veri = kickTakip.get(moderatorId);

  if (!veri || simdi - veri.zaman > KICK_ARALIK) {
    veri = { sayac: 1, zaman: simdi };
  } else {
    veri.sayac++;
  }

  kickTakip.set(moderatorId, veri);

  if (veri.sayac >= KICK_SINIR) {
    kickTakip.delete(moderatorId);
    try {
      const uye = await guild.members.fetch(moderatorId).catch(() => null);
      if (!uye) return;

      // Bot veya sunucu sahibiyse dokunma
      if (uye.id === guild.ownerId) return;
      if (uye.user.bot) return;

      // Tüm rolleri kaldır
      const roller = uye.roles.cache.filter(r => r.id !== guild.roles.everyone.id);
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

    const loglar = await guild.fetchAuditLogs({ type: 50, limit: 1 }).catch(() => null);
    const giris = loglar?.entries?.first();
    const yapanId = giris?.executorId;

    if (yapanId) {
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
