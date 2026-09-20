// ==========================================
//  VirBot v2 — Anti-Raid (Mass-Kick Guard)
//  Webhook Guard yardımcısı
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
        await uye.roles.remove(rol, 'VirBot — Mass-Kick / Anti-Raid otomatik koruma').catch(() => {});
      }

      // DM uyarısı
      await uye.send('⚠️ **VirBot Güvenlik Uyarısı:** Kısa sürede çok fazla üye attığınız için rolleriniz otomatik olarak kaldırıldı. Sunucu yöneticisiyle iletişime geçin.').catch(() => {});

      // Log
      const embed = logEmbed(
        '🛡️ Anti-Raid — Mass-Kick Engellendi',
        `**Moderatör:** <@${moderatorId}>\n**İşlem:** ${veri.sayac} kick/ban 10 saniyede tespit edildi.\n**Sonuç:** Tüm rolleri kaldırıldı.`,
        RENKLER.GUVENLIK,
      );
      await logGonder(client, guild.id, embed);
    } catch (hata) {
      console.error('[ANTİ-RAİD] Mass-kick koruma hatası:', hata.message);
    }
  }
}

/**
 * İzinsiz webhook silinir.
 */
async function webhookKontrol(webhook, client) {
  try {
    const guild = webhook.guild;
    if (!guild) return;

    // Webhook'u kim yarattıysa kontrol et
    const loglar = await guild.fetchAuditLogs({ type: 50, limit: 1 }).catch(() => null);
    const giris = loglar?.entries?.first();
    const yapanId = giris?.executorId;

    if (yapanId) {
      const uye = await guild.members.fetch(yapanId).catch(() => null);
      const yetkili = uye?.permissions?.has(PermissionFlagsBits.ManageWebhooks);
      if (yetkili) return; // Yetkili biri yaptı, sorun yok
    }

    // Yetkisiz webhook — sil
    await webhook.delete('VirBot — Yetkisiz webhook silindi').catch(() => {});

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

module.exports = { massKickKontrol, webhookKontrol };
