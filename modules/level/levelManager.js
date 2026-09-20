// ==========================================
//  VirBot v2 — Level / XP Yöneticisi
//  Canvas Rank Kartı + Leaderboard
// ==========================================
'use strict';

const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { LEVEL, RENKLER, CANVAS: CANV } = require('../../config/config');
const {
  kullaniciGetir,
  kullaniciGuncelle,
  xpCooldownKontrol,
  liderTabelaGetir,
} = require('../data/dataManager');
const { logEmbed, logGonder } = require('../logger/logManager');
const { EmbedBuilder } = require('discord.js');

// ─── XP Ekle ───────────────────────────────────────────────
async function xpEkle(member, client) {
  const { user, guild } = member;
  if (user.bot) return;

  if (!xpCooldownKontrol(user.id, guild.id, LEVEL.COOLDOWN_MS)) return null;

  const kullanici = await kullaniciGetir(user.id, guild.id);
  const xpKazanc  = Math.floor(Math.random() * (LEVEL.MAX_XP - LEVEL.MIN_XP + 1)) + LEVEL.MIN_XP;
  const yeniXp    = kullanici.xp + xpKazanc;
  const yeniLevel = levelHesapla(yeniXp);
  const levelAtladi = yeniLevel > kullanici.level;

  await kullaniciGuncelle(user.id, guild.id, { xp: yeniXp, level: yeniLevel });

  if (levelAtladi) {
    // Level atladı bildirimi
    const embed = new EmbedBuilder()
      .setTitle('⬆️ Seviye Atlandı!')
      .setDescription(`🎉 ${member} **${yeniLevel}. seviyeye** ulaştı! Tebrikler!`)
      .setColor(RENKLER.LEVEL)
      .setThumbnail(user.displayAvatarURL({ extension: 'png', size: 128 }))
      .setTimestamp();

    const logEmb = logEmbed(
      'Seviye Atlandı',
      `**Kullanıcı:** ${user.tag}\n**Seviye:** ${kullanici.level} → ${yeniLevel}`,
      RENKLER.LEVEL,
    );
    await logGonder(client, guild.id, logEmb);

    return { levelAtladi: true, yeniLevel, embed };
  }

  return { levelAtladi: false };
}

function levelHesapla(xp) {
  let level = 0;
  while (xp >= LEVEL.XP_CARPAN(level)) {
    xp -= LEVEL.XP_CARPAN(level);
    level++;
  }
  return level;
}

function levelXpGereki(level) {
  return LEVEL.XP_CARPAN(level);
}

function mevcutLevelXp(xpToplam, level) {
  let kalan = xpToplam;
  for (let i = 0; i < level; i++) kalan -= LEVEL.XP_CARPAN(i);
  return Math.max(0, kalan);
}

// ─── Canvas Rank Kartı ─────────────────────────────────────
async function rankKartOlustur(member, kullanici, sira) {
  const { GENISLIK, YUKSEKLIK, AVATAR_BOYUTU, AVATAR_X, AVATAR_Y, CERCEVE_RENGI_1, CERCEVE_RENGI_2 } = CANV;
  const canvas = createCanvas(GENISLIK, YUKSEKLIK);
  const ctx    = canvas.getContext('2d');

  // ── Arka Plan ────────────────────────────────────────────
  if (kullanici.bgUrl) {
    try {
      const bg = await loadImage(kullanici.bgUrl);
      ctx.drawImage(bg, 0, 0, GENISLIK, YUKSEKLIK);
      // Karartma overlay
      ctx.fillStyle = 'rgba(5,5,15,0.72)';
      ctx.fillRect(0, 0, GENISLIK, YUKSEKLIK);
    } catch (_) { gradientArkaplan(ctx, GENISLIK, YUKSEKLIK); }
  } else {
    gradientArkaplan(ctx, GENISLIK, YUKSEKLIK);
  }

  // ── Grid ─────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(88,101,242,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < GENISLIK; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, YUKSEKLIK); ctx.stroke(); }
  for (let y = 0; y < YUKSEKLIK; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GENISLIK, y); ctx.stroke(); }

  // ── Neon Çerçeve ─────────────────────────────────────────
  const cerc = ctx.createLinearGradient(0, 0, GENISLIK, YUKSEKLIK);
  cerc.addColorStop(0, CERCEVE_RENGI_1);
  cerc.addColorStop(1, CERCEVE_RENGI_2);
  ctx.strokeStyle = cerc;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, GENISLIK - 16, YUKSEKLIK - 16);

  // ── Avatar ───────────────────────────────────────────────
  const mx = AVATAR_X + AVATAR_BOYUTU / 2, my = AVATAR_Y + AVATAR_BOYUTU / 2, r = AVATAR_BOYUTU / 2;

  ctx.save(); ctx.shadowColor = '#5865F2'; ctx.shadowBlur = 30;
  ctx.strokeStyle = '#5865F2'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(mx, my, r + 6, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  try {
    const avatarImg = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(avatarImg, AVATAR_X, AVATAR_Y, AVATAR_BOYUTU, AVATAR_BOYUTU);
    ctx.restore();
  } catch (_) {}

  // ── Yazılar ──────────────────────────────────────────────
  const tx = AVATAR_X + AVATAR_BOYUTU + 40;

  // Rank badge
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = 'rgba(88,101,242,0.3)';
  ctx.fillRect(tx, 70, 90, 26);
  ctx.fillStyle = '#99AAF0';
  ctx.fillText(`# ${sira}. SIRADA`, tx + 8, 88);

  // İsim
  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#5865F2'; ctx.shadowBlur = 12;
  ctx.fillText(member.user.username.slice(0, 18), tx, 140);
  ctx.shadowBlur = 0;

  // Level
  const levGrad = ctx.createLinearGradient(tx, 0, tx + 150, 0);
  levGrad.addColorStop(0, CERCEVE_RENGI_1); levGrad.addColorStop(1, CERCEVE_RENGI_2);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = levGrad;
  ctx.fillText(`LEVEL ${kullanici.level}`, tx, 172);

  // XP metni
  const levelXp   = mevcutLevelXp(kullanici.xp, kullanici.level);
  const xpGereken = levelXpGereki(kullanici.level);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(`${levelXp.toLocaleString('tr-TR')} / ${xpGereken.toLocaleString('tr-TR')} XP`, tx, 198);

  // XP Bar
  const barX = tx, barY = 210, barW = GENISLIK - tx - 50, barH = 18;
  const oran = Math.min(levelXp / xpGereken, 1);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 9); ctx.fill();

  if (oran > 0) {
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, '#5865F2'); barGrad.addColorStop(1, '#00FFD4');
    ctx.fillStyle = barGrad;
    ctx.save(); ctx.shadowColor = '#5865F2'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * oran, barH, 9); ctx.fill();
    ctx.restore();
  }

  // Coins
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`🪙 ${kullanici.coins?.toLocaleString('tr-TR') || 0}`, tx, 252);

  return canvas.toBuffer('image/png');
}

function gradientArkaplan(ctx, w, h) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0a0a14'); bg.addColorStop(0.5, '#0d1526'); bg.addColorStop(1, '#0a0a14');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
}

// ─── Leaderboard ───────────────────────────────────────────
async function leaderboard(guildId, limit = 10) {
  return liderTabelaGetir(guildId, limit);
}

module.exports = { xpEkle, rankKartOlustur, leaderboard, levelHesapla, mevcutLevelXp, levelXpGereki };
