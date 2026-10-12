// ==========================================
//  VirBot v6 — Jail Yöneticisi
//  Hapis sistemi: kanal + rol oluşturma, at/kurtar
// ==========================================
'use strict';

const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logEmbed, logGonder } = require('../logger/logManager');
const { RENKLER } = require('../../config/config');

const JAIL_ROL_ADI  = 'CEZALI';
const JAIL_KANAL_ADI = 'jail';

// ─── Jail Rolü Getir veya Oluştur ──────────────────────────
async function jailRolGetirVeyaOlustur(guild) {
  let rol = guild.roles.cache.find(r => r.name === JAIL_ROL_ADI);
  if (!rol) {
    rol = await guild.roles.create({
      name: JAIL_ROL_ADI,
      color: 0x808080,
      reason: 'VirBot v6 — Jail sistemi kurulumu',
    });
  }
  return rol;
}

// ─── Jail Kanalı Getir veya Oluştur ────────────────────────
async function jailKanalGetirVeyaOlustur(guild, cezaliRol) {
  let kanal = guild.channels.cache.find(
    c => c.name === JAIL_KANAL_ADI && c.type === ChannelType.GuildText
  );
  if (kanal) return kanal;

  // Jail kanalı yok → oluştur
  kanal = await guild.channels.create({
    name: JAIL_KANAL_ADI,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      // @everyone → hiçbir şey göremesin
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      // CEZALI rolü → yalnızca bu kanalı görebilsin
      {
        id: cezaliRol.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        deny:  [PermissionFlagsBits.AddReactions, PermissionFlagsBits.AttachFiles],
      },
    ],
    topic: '🔒 Bu kanal yalnızca cezalı kullanıcılara görünür.',
    reason: 'VirBot v6 — Jail sistemi kurulumu',
  });

  return kanal;
}

// ─── Jail Kur ──────────────────────────────────────────────
async function jailKur(guild, client) {
  const cezaliRol = await jailRolGetirVeyaOlustur(guild);
  const jailKanal = await jailKanalGetirVeyaOlustur(guild, cezaliRol);

  // Tüm diğer kanallar → CEZALI rolü göremesin
  for (const [, kanal] of guild.channels.cache) {
    if (kanal.id === jailKanal.id) continue;
    if (!kanal.isTextBased() && kanal.type !== ChannelType.GuildVoice) continue;
    await kanal.permissionOverwrites.edit(cezaliRol, {
      ViewChannel: false,
      Connect: false,
    }).catch(() => {});
  }

  return { cezaliRol, jailKanal };
}

// ─── Jail At ───────────────────────────────────────────────
async function jailAt(hedef, moderator, guild, sebep, client) {
  try {
    const cezaliRol = await jailRolGetirVeyaOlustur(guild);
    await jailKanalGetirVeyaOlustur(guild, cezaliRol);

    // Mevcut rolleri kaydet (CEZALI ve @everyone hariç)
    const eskiRoller = hedef.roles.cache
      .filter(r => r.id !== guild.roles.everyone.id && r.id !== cezaliRol.id)
      .map(r => r.id);

    // Mevcut rolleri kaldır → CEZALI rolü ver
    if (eskiRoller.length > 0) {
      await hedef.roles.remove(eskiRoller, 'VirBot v6 — Jail: roller kaldırıldı').catch(() => {});
    }
    await hedef.roles.add(cezaliRol, `VirBot v6 — Jail: ${sebep || 'Sebep belirtilmedi'}`).catch(() => {});

    // Eski rolleri veritabanında sakla
    const { guildGuncelle, guildGetir } = require('../data/dataManager');
    const gAyar = await guildGetir(guild.id);
    const mevcutHapis = gAyar.hapishane || {};
    mevcutHapis[hedef.id] = eskiRoller;
    await guildGuncelle(guild.id, { hapishane: mevcutHapis });

    // Log
    const embed = logEmbed(
      '🔒 Jail — Kullanıcı Hapsedildi',
      `**Kullanıcı:** ${hedef.user.tag} (<@${hedef.id}>)\n` +
      `**ID:** \`${hedef.id}\`\n` +
      `**Moderatör:** ${moderator.user.tag}\n` +
      `**Sebep:** ${sebep || 'Belirtilmedi'}`,
      RENKLER.HATA
    );
    await logGonder(client, guild.id, embed);

    return { basarili: true, eskiRolSayisi: eskiRoller.length };
  } catch (hata) {
    console.error('[JAIL] At hatası:', hata.message);
    return { hata: hata.message };
  }
}

// ─── Jail Kurtar ────────────────────────────────────────────
async function jailKurtar(hedef, moderator, guild, client) {
  try {
    const cezaliRol = guild.roles.cache.find(r => r.name === JAIL_ROL_ADI);
    if (!cezaliRol) return { hata: '❌ CEZALI rolü bulunamadı! Önce `/jail-kur` çalıştırın.' };

    if (!hedef.roles.cache.has(cezaliRol.id)) {
      return { hata: '❌ Bu kullanıcı zaten hapiste değil.' };
    }

    // Eski rolleri geri al
    const { guildGuncelle, guildGetir } = require('../data/dataManager');
    const gAyar = await guildGetir(guild.id);
    const mevcutHapis = gAyar.hapishane || {};
    const eskiRolIdler = mevcutHapis[hedef.id] || [];

    // CEZALI rolünü kaldır
    await hedef.roles.remove(cezaliRol, 'VirBot v6 — Jail: serbest bırakıldı').catch(() => {});

    // Eski rolleri geri ver
    if (eskiRolIdler.length > 0) {
      const geçerliRoller = eskiRolIdler.filter(id => guild.roles.cache.has(id));
      if (geçerliRoller.length > 0) {
        await hedef.roles.add(geçerliRoller, 'VirBot v6 — Jail: roller iade edildi').catch(() => {});
      }
    }

    // Hapishane kaydını sil
    delete mevcutHapis[hedef.id];
    await guildGuncelle(guild.id, { hapishane: mevcutHapis });

    // Log
    const embed = logEmbed(
      '🔓 Jail — Kullanıcı Serbest Bırakıldı',
      `**Kullanıcı:** ${hedef.user.tag} (<@${hedef.id}>)\n` +
      `**ID:** \`${hedef.id}\`\n` +
      `**Moderatör:** ${moderator.user.tag}\n` +
      `**İade Edilen Rol Sayısı:** ${eskiRolIdler.length}`,
      RENKLER.BASARI
    );
    await logGonder(client, guild.id, embed);

    return { basarili: true, iadeSayisi: eskiRolIdler.length };
  } catch (hata) {
    console.error('[JAIL] Kurtar hatası:', hata.message);
    return { hata: hata.message };
  }
}

// ─── Anti-Jail (Kanaldan çıkıp girince tekrar rol ver) ──────
async function antiJailKontrol(member, client) {
  try {
    const { guildGetir } = require('../data/dataManager');
    const gAyar = await guildGetir(member.guild.id);
    const hapishane = gAyar.hapishane || {};
    if (!hapishane[member.id]) return; // Kayıtlı değil

    // Kayıtlıysa CEZALI rolü ver
    const guild = member.guild;
    const cezaliRol = guild.roles.cache.find(r => r.name === JAIL_ROL_ADI);
    if (!cezaliRol) return;

    if (!member.roles.cache.has(cezaliRol.id)) {
      await member.roles.add(cezaliRol, 'VirBot v6 — Anti-Jail: tekrar hapsedildi').catch(() => {});
      // Diğer rolleri kaldır
      const digerRoller = member.roles.cache
        .filter(r => r.id !== guild.roles.everyone.id && r.id !== cezaliRol.id)
        .map(r => r.id);
      if (digerRoller.length > 0) {
        await member.roles.remove(digerRoller, 'VirBot v6 — Anti-Jail').catch(() => {});
      }

      const embed = logEmbed(
        '🔁 Anti-Jail — Cezalı Kullanıcı Tekrar Tespit Edildi',
        `**Kullanıcı:** ${member.user.tag} (<@${member.id}>)\n` +
        `**Durum:** Sunucuya yeniden katıldı, CEZALI rolü tekrar verildi.`,
        RENKLER.UYARI
      );
      await logGonder(client, member.guild.id, embed);
    }
  } catch (hata) {
    console.error('[ANTI-JAIL] Hata:', hata.message);
  }
}

module.exports = { jailKur, jailAt, jailKurtar, antiJailKontrol, JAIL_ROL_ADI, JAIL_KANAL_ADI };
