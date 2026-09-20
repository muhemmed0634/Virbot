// ==========================================
//  VirBot v2 — Canvas Karşılama / Veda Kartı
//  ErenSi tarzı siber temalı kart
// ==========================================
'use strict';

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const { CANVAS } = require('../../config/config');

const { GENISLIK, YUKSEKLIK, AVATAR_BOYUTU, AVATAR_X, AVATAR_Y, CERCEVE_RENGI_1, CERCEVE_RENGI_2 } = CANVAS;

/**
 * ErenSi tarzı hoş geldin/güle güle kartı üretir.
 * @param {GuildMember} member
 * @param {'giris'|'cikis'} tip
 * @param {number} sira - Üye sırası
 * @returns {Buffer}
 */
async function kartOlustur(member, tip = 'giris', sira = 0) {
  const canvas = createCanvas(GENISLIK, YUKSEKLIK);
  const ctx = canvas.getContext('2d');

  // ─── Arka Plan ─────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, GENISLIK, YUKSEKLIK);
  bg.addColorStop(0, '#0a0a14');
  bg.addColorStop(0.5, '#0d1526');
  bg.addColorStop(1, '#0a0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GENISLIK, YUKSEKLIK);

  // ─── Siber Grid Çizgileri ──────────────────────────────────
  ctx.strokeStyle = 'rgba(255,107,0,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < GENISLIK; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, YUKSEKLIK); ctx.stroke();
  }
  for (let y = 0; y < YUKSEKLIK; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GENISLIK, y); ctx.stroke();
  }

  // ─── Neon Kenar Çerçeve ────────────────────────────────────
  const cerceveSiniri = 8;
  const cerc = ctx.createLinearGradient(0, 0, GENISLIK, YUKSEKLIK);
  cerc.addColorStop(0, CERCEVE_RENGI_1);
  cerc.addColorStop(1, CERCEVE_RENGI_2);
  ctx.strokeStyle = cerc;
  ctx.lineWidth = 4;
  ctx.strokeRect(cerceveSiniri, cerceveSiniri, GENISLIK - cerceveSiniri * 2, YUKSEKLIK - cerceveSiniri * 2);

  // ─── Avatar Yuvarlak Maske ─────────────────────────────────
  const avatarMerkez = { x: AVATAR_X + AVATAR_BOYUTU / 2, y: AVATAR_Y + AVATAR_BOYUTU / 2 };
  const yari = AVATAR_BOYUTU / 2;

  // Dış parlama (glow)
  ctx.save();
  ctx.shadowColor = tip === 'giris' ? CERCEVE_RENGI_2 : CERCEVE_RENGI_1;
  ctx.shadowBlur = 35;
  ctx.strokeStyle = tip === 'giris' ? CERCEVE_RENGI_2 : CERCEVE_RENGI_1;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(avatarMerkez.x, avatarMerkez.y, yari + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // İkinci çerçeve halkası
  ctx.strokeStyle = tip === 'giris' ? CERCEVE_RENGI_1 : '#888888';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarMerkez.x, avatarMerkez.y, yari + 12, 0, Math.PI * 2);
  ctx.stroke();

  // Avatar yükle ve çiz
  try {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatarImg = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarMerkez.x, avatarMerkez.y, yari, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, AVATAR_X, AVATAR_Y, AVATAR_BOYUTU, AVATAR_BOYUTU);
    ctx.restore();
  } catch (_) { /* Avatar yüklenemezse boş bırak */ }

  // ─── Yazılar ───────────────────────────────────────────────
  const metin_x = AVATAR_X + AVATAR_BOYUTU + 40;

  // Üst başlık
  const ustYazi = tip === 'giris' ? '✦ HOŞ GELDİN ✦' : '✦ GÜLE GÜLE ✦';
  const ustRenk = tip === 'giris'
    ? ctx.createLinearGradient(metin_x, 0, GENISLIK - 40, 0)
    : ctx.createLinearGradient(metin_x, 0, GENISLIK - 40, 0);

  if (tip === 'giris') {
    ustRenk.addColorStop(0, '#FF6B00'); ustRenk.addColorStop(1, '#00FF88');
  } else {
    ustRenk.addColorStop(0, '#888888'); ustRenk.addColorStop(1, '#FF4444');
  }

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = ustRenk;
  ctx.letterSpacing = '6px';
  ctx.fillText(ustYazi, metin_x, 105);

  // Kullanıcı adı
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = tip === 'giris' ? '#00FF88' : '#FF4444';
  ctx.shadowBlur = 15;
  const adText = member.user.username.slice(0, 18);
  ctx.fillText(adText, metin_x, 155);
  ctx.shadowBlur = 0;

  // Sunucu adı
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(200,200,200,0.7)';
  ctx.fillText(member.guild.name, metin_x, 183);

  // Ayıraç çizgisi
  ctx.strokeStyle = tip === 'giris' ? CERCEVE_RENGI_2 : '#888888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(metin_x, 196);
  ctx.lineTo(GENISLIK - 40, 196);
  ctx.stroke();

  // Üye sırası
  ctx.font = 'bold 20px sans-serif';
  const siraRenk = ctx.createLinearGradient(metin_x, 0, metin_x + 200, 0);
  siraRenk.addColorStop(0, CERCEVE_RENGI_1);
  siraRenk.addColorStop(1, CERCEVE_RENGI_2);
  ctx.fillStyle = siraRenk;
  ctx.fillText(`# ${sira.toLocaleString('tr-TR')}. Üye`, metin_x, 228);

  // Alt Köşe — sunucu logosu benzeri efekt
  ctx.fillStyle = 'rgba(255,107,0,0.08)';
  ctx.beginPath();
  ctx.arc(GENISLIK - 60, YUKSEKLIK - 60, 80, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

module.exports = { kartOlustur };
