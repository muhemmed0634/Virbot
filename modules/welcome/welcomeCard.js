// ==========================================
//  VirBot — Modern Karşılama ve Veda Kartı
//  Giriş (Hoş Geldin) & Çıkış (Görüşmek Üzere)
// ==========================================
'use strict';

const { createCanvas, loadImage } = require('@napi-rs/canvas');

/**
 * Yuvarlatılmış dikdörtgen çizer.
 */
function yuvarlakDikdortgen(ctx, x, y, genislik, yukseklik, yaricap) {
  ctx.beginPath();
  ctx.moveTo(x + yaricap, y);
  ctx.lineTo(x + genislik - yaricap, y);
  ctx.quadraticCurveTo(x + genislik, y, x + genislik, y + yaricap);
  ctx.lineTo(x + genislik, y + yukseklik - yaricap);
  ctx.quadraticCurveTo(x + genislik, y + yukseklik, x + genislik - yaricap, y + yukseklik);
  ctx.lineTo(x + yaricap, y + yukseklik);
  ctx.quadraticCurveTo(x, y + yukseklik, x, y + yukseklik - yaricap);
  ctx.lineTo(x, y + yaricap);
  ctx.quadraticCurveTo(x, y, x + yaricap, y);
  ctx.closePath();
}

/**
 * Tarihi DD.MM.YYYY • HH:mm formatına dönüştürür.
 */
function tarihFormatla(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const gun = pad(d.getDate());
  const ay = pad(d.getMonth() + 1);
  const yil = d.getFullYear();
  const saat = pad(d.getHours());
  const dakika = pad(d.getMinutes());
  return `${gun}.${ay}.${yil} • ${saat}:${dakika}`;
}

/**
 * Modern Hoş Geldin / Görüşmek Üzere kartı üretir.
 * @param {GuildMember} member
 * @param {'giris'|'cikis'} tip
 * @param {number} [uyeSayisi]
 * @returns {Promise<Buffer>}
 */
async function kartOlustur(member, tip = 'giris', uyeSayisi = 0) {
  const GENISLIK = 800;
  const YUKSEKLIK = 270;
  const canvas = createCanvas(GENISLIK, YUKSEKLIK);
  const ctx = canvas.getContext('2d');

  const isGiris = tip === 'giris';
  const temaRenk = isGiris ? '#00e676' : '#ff4757'; // Neon Yeşil vs Neon Kırmızı
  const golgeRenk = isGiris ? 'rgba(0, 230, 118, 0.45)' : 'rgba(255, 71, 87, 0.45)';

  // ─── 1. Kart Arka Planı (Yuvarlak Hatlı Koyu Tema) ─────────
  ctx.save();
  yuvarlakDikdortgen(ctx, 0, 0, GENISLIK, YUKSEKLIK, 20);
  ctx.clip();

  const bgGrad = ctx.createLinearGradient(0, 0, GENISLIK, YUKSEKLIK);
  bgGrad.addColorStop(0, '#090e17');
  bgGrad.addColorStop(0.5, '#0d1524');
  bgGrad.addColorStop(1, '#0a101b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, GENISLIK, YUKSEKLIK);

  // ─── 2. Sağ Alt Köşedeki Dekoratif Geçişli Daireler ────────
  if (isGiris) {
    // Yeşil / Teal / Mavi şeffaf halkalar
    ctx.fillStyle = 'rgba(0, 200, 115, 0.22)';
    ctx.beginPath(); ctx.arc(580, 260, 120, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(0, 180, 216, 0.18)';
    ctx.beginPath(); ctx.arc(700, 245, 110, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(0, 230, 118, 0.24)';
    ctx.beginPath(); ctx.arc(780, 265, 95, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.20)';
    ctx.beginPath(); ctx.arc(650, 295, 90, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(79, 70, 229, 0.22)';
    ctx.beginPath(); ctx.arc(730, 310, 80, 0, Math.PI * 2); ctx.fill();
  } else {
    // Kırmızı / Mor / Derin Mavi şeffaf halkalar
    ctx.fillStyle = 'rgba(0, 150, 200, 0.16)';
    ctx.beginPath(); ctx.arc(580, 260, 120, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(0, 180, 216, 0.16)';
    ctx.beginPath(); ctx.arc(700, 245, 110, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(24, 119, 242, 0.18)';
    ctx.beginPath(); ctx.arc(780, 265, 95, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(14, 165, 233, 0.20)';
    ctx.beginPath(); ctx.arc(650, 295, 90, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(79, 70, 229, 0.18)';
    ctx.beginPath(); ctx.arc(730, 310, 80, 0, Math.PI * 2); ctx.fill();
  }

  // ─── 3. Sol Kenar Dikey Renk Çubuğu (Accent Bar) ───────────
  ctx.save();
  ctx.shadowColor = golgeRenk;
  ctx.shadowBlur = 12;
  ctx.fillStyle = temaRenk;
  yuvarlakDikdortgen(ctx, 18, 20, 6, 230, 3);
  ctx.fill();
  ctx.restore();

  // ─── 4. Avatar Alanı ve Dış Neon Halka ──────────────────────
  const avatarMerkez = { x: 135, y: 135 };
  const avatarYaricap = 58;

  // Dış neon halka
  ctx.save();
  ctx.shadowColor = temaRenk;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = temaRenk;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarMerkez.x, avatarMerkez.y, avatarYaricap + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Avatar Resmini Yükle ve Maskele
  try {
    const avatarUrl = member.user?.displayAvatarURL
      ? member.user.displayAvatarURL({ extension: 'png', size: 256 })
      : null;

    if (avatarUrl) {
      const avatarImg = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarMerkez.x, avatarMerkez.y, avatarYaricap, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        avatarImg,
        avatarMerkez.x - avatarYaricap,
        avatarMerkez.y - avatarYaricap,
        avatarYaricap * 2,
        avatarYaricap * 2
      );
      ctx.restore();
    } else {
      throw new Error('Avatar yok');
    }
  } catch (_) {
    // Avatar yüklenemezse şık harf baş harfi çiz
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarMerkez.x, avatarMerkez.y, avatarYaricap, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const harf = (member.displayName || member.user?.username || '?').charAt(0).toUpperCase();
    ctx.fillText(harf, avatarMerkez.x, avatarMerkez.y);
    ctx.restore();
  }

  // ─── 5. Metinler (Avatarın Sağında) ────────────────────────
  const metinX = 230;

  // 1. Üst Etiket (HOŞ GELDİN veya GÖRÜŞMEK ÜZERE)
  ctx.font = 'bold 16px "DejaVu Sans", "Liberation Sans", sans-serif';
  ctx.fillStyle = temaRenk;
  ctx.fillText(isGiris ? 'HOŞ GELDİN' : 'GÖRÜŞMEK ÜZERE', metinX, 84);

  // 2. Kullanıcı Adı (Beyaz & Kalın)
  ctx.font = 'bold 32px "DejaVu Sans", "Liberation Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  const hamAd = member.displayName || member.user?.globalName || member.user?.username || 'Kullanıcı';
  const gorunenAd = hamAd.length > 22 ? hamAd.slice(0, 20) + '...' : hamAd;
  ctx.fillText(gorunenAd, metinX, 124);

  // 3. Sunucu Adı (Açık Gri / Muted Slate)
  ctx.font = '500 16px "DejaVu Sans", "Liberation Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  const sunucuAd = member.guild?.name || 'Discord Sunucusu';
  const gorunenSunucu = sunucuAd.length > 35 ? sunucuAd.slice(0, 33) + '...' : sunucuAd;
  ctx.fillText(gorunenSunucu, metinX, 158);

  // 4. Üye Sayısı Bilgisi
  const toplamUye = uyeSayisi || member.guild?.memberCount || 0;
  ctx.font = '400 15px "DejaVu Sans", "Liberation Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  const uyeMetni = isGiris
    ? `Seninle birlikte ${toplamUye} üyeyiz.`
    : `Sunucuda ${toplamUye} üye kaldı.`;
  ctx.fillText(uyeMetni, metinX, 192);

  // 5. Tarih & Saat (24.09.2026 • 21:56)
  ctx.font = '400 14px "DejaVu Sans", "Liberation Sans", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(tarihFormatla(new Date()), metinX, 220);

  // ─── 6. Kart Dış İnce Kenarlık ─────────────────────────────
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  yuvarlakDikdortgen(ctx, 0.75, 0.75, GENISLIK - 1.5, YUKSEKLIK - 1.5, 20);
  ctx.stroke();

  ctx.restore(); // Ana klip sınırını kaldır

  return canvas.toBuffer('image/png');
}

/**
 * Geriye dönük uyumluluk yardımcıları
 */
async function karsilamaKartiOlustur(member, sira) {
  return kartOlustur(member, 'giris', sira);
}

async function vedaKartiOlustur(member, sira) {
  return kartOlustur(member, 'cikis', sira);
}

module.exports = {
  kartOlustur,
  karsilamaKartiOlustur,
  vedaKartiOlustur,
};
