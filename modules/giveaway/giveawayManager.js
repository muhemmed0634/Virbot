// ==========================================
//  VirBot — Çekiliş Yöneticisi
//  Zamanlayıcı ve kazanan seçimi
// ==========================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { cekilisGetir, cekilisKaydet, cekilisler, cekilisSil } = require('../data/dataManager');
const { logGonder, logEmbed } = require('../logger/logManager');

// ─── Süre Çevrici ──────────────────────────────────────────
function sureyiCevir(metin) {
  const esleme = metin.match(/^(\d+)(s|m|h|d)$/i);
  if (!esleme) return null;
  const sayi = parseInt(esleme[1]);
  const birim = esleme[2].toLowerCase();
  const carpan = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return sayi * carpan[birim];
}

function sureMetni(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [d && `${d}g`, h && `${h}sa`, m && `${m}dk`, s && `${s}sn`].filter(Boolean).join(' ');
}

// ─── Embed Oluşturucu ──────────────────────────────────────
function cekilisEmbedOlustur(veri, bitti = false) {
  const bitisTarihi = new Date(veri.bitisTarihi);
  const embed = new EmbedBuilder()
    .setTitle(`🎉 ÇEKİLİŞ: ${veri.odul}`)
    .setColor(bitti ? RENKLER.BASARI : RENKLER.CEKİLİŞ)
    .setThumbnail('attachment://virbot.png')
    .addFields(
      { name: '🏆 Ödül', value: veri.odul, inline: true },
      { name: '👑 Kazanan Sayısı', value: `${veri.kazananSayisi}`, inline: true },
      { name: '🕐 Bitiş', value: bitti ? '✅ Çekiliş Tamamlandı' : `<t:${Math.floor(bitisTarihi.getTime() / 1000)}:R>`, inline: true },
      { name: '👥 Katılımcı', value: `${veri.katilimcilar?.length || 0}`, inline: true },
      ...(veri.minDavet > 0 ? [{ name: '📨 Min. Davet', value: `${veri.minDavet}`, inline: true }] : []),
      ...(veri.rolSarti ? [{ name: '🏷️ Rol Şartı', value: `<@&${veri.rolSarti}>`, inline: true }] : []),
      ...(veri.minHesapYasi > 0 ? [{ name: '📅 Min. Hesap Yaşı', value: `${veri.minHesapYasi} gün`, inline: true }] : []),
    )
    .setFooter({ text: bitti ? 'Çekiliş tamamlandı' : 'Katılmak için aşağıdaki düğmeye tıkla!' })
    .setTimestamp();

  return embed;
}

// ─── Çekiliş Başlatma ──────────────────────────────────────
async function cekilisBaslat(client, veri) {
  try {
    const kanal = await client.channels.fetch(veri.kanalId).catch(() => null);
    if (!kanal) return;

    const embed = cekilisEmbedOlustur(veri);
    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cekilise_katil_${veri.mesajId || 'bekle'}`)
        .setLabel('🎉 Katıl!')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`cekilisi_bitir_${veri.mesajId || 'bekle'}`)
        .setLabel('⏹️ Bitir (Admin)')
        .setStyle(ButtonStyle.Danger),
    );

    const mesaj = await kanal.send({
      embeds: [embed],
      components: [butonlar],
      files: [{ attachment: require('path').join(__dirname, '..', '..', 'virbot.png'), name: 'virbot.png' }],
    });

    // Mesaj ID'sini kaydedelim
    veri.mesajId = mesaj.id;
    veri.katilimcilar = [];
    cekilisKaydet(mesaj.id, veri);

    // Düğme custom ID'lerini güncelle
    const guncelButonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cekilise_katil_${mesaj.id}`)
        .setLabel('🎉 Katıl!')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`cekilisi_bitir_${mesaj.id}`)
        .setLabel('⏹️ Bitir (Admin)')
        .setStyle(ButtonStyle.Danger),
    );
    await mesaj.edit({ components: [guncelButonlar] });

    // Zamanlayıcı kur
    const kalan = veri.bitisTarihi - Date.now();
    if (kalan > 0) {
      setTimeout(() => cekilisiBitir(client, mesaj.id), kalan);
    }

    return mesaj;
  } catch (hata) {
    console.error('[ÇEKİLİŞ] Başlatma hatası:', hata.message);
  }
}

// ─── Çekiliş Bitirme ───────────────────────────────────────
async function cekilisiBitir(client, mesajId) {
  const veri = cekilisGetir(mesajId);
  if (!veri || veri.bitti) return;

  veri.bitti = true;
  cekilisKaydet(mesajId, veri);

  try {
    const kanal = await client.channels.fetch(veri.kanalId).catch(() => null);
    if (!kanal) return;

    const mesaj = await kanal.messages.fetch(mesajId).catch(() => null);

    const kazananlar = kazananlariSec(veri.katilimcilar || [], veri.kazananSayisi);

    const bitisEmbed = cekilisEmbedOlustur(veri, true).setDescription(
      kazananlar.length
        ? `🎊 Tebrikler! ${kazananlar.map(k => `<@${k}>`).join(', ')} kazandı!`
        : '😔 Yeterli katılımcı olmadığı için kazanan seçilemedi.',
    );

    if (mesaj) {
      await mesaj.edit({ embeds: [bitisEmbed], components: [] });
    }

    await kanal.send({
      content: kazananlar.length
        ? `🎉 **${veri.odul}** çekilişini ${kazananlar.map(k => `<@${k}>`).join(', ')} kazandı! Tebrikler!`
        : `😔 **${veri.odul}** çekilişinde yeterli katılımcı yoktu.`,
    });

    // Log
    const logEmb = logEmbed(
      'Çekiliş Tamamlandı',
      `**Ödül:** ${veri.odul}\n**Kanal:** <#${veri.kanalId}>\n**Kazanan(lar):** ${kazananlar.length ? kazananlar.map(k => `<@${k}>`).join(', ') : 'Yok'}\n**Katılımcı:** ${veri.katilimcilar?.length || 0}`,
      RENKLER.BASARI,
    );
    await logGonder(client, veri.guildId, logEmb);
  } catch (hata) {
    console.error('[ÇEKİLİŞ] Bitirme hatası:', hata.message);
  }
}

// ─── Kazanan Seçimi ────────────────────────────────────────
function kazananlariSec(katilimcilar, adet) {
  if (!katilimcilar || katilimcilar.length === 0) return [];
  const karistir = [...katilimcilar].sort(() => Math.random() - 0.5);
  return karistir.slice(0, Math.min(adet, karistir.length));
}

// ─── Yeniden Çekiliş ───────────────────────────────────────
async function yenidenCek(client, mesajId, guildId) {
  const veri = cekilisGetir(mesajId);
  if (!veri) return { basari: false, mesaj: 'Bu ID\'ye ait bir çekiliş bulunamadı.' };

  const kazananlar = kazananlariSec(veri.katilimcilar || [], veri.kazananSayisi);

  const kanal = await client.channels.fetch(veri.kanalId).catch(() => null);
  if (kanal) {
    await kanal.send({
      content: kazananlar.length
        ? `🔄 **Yeniden Çekiliş!** **${veri.odul}** çekilişini ${kazananlar.map(k => `<@${k}>`).join(', ')} kazandı!`
        : `😔 Yeniden çekilişte de yeterli katılımcı bulunamadı.`,
    });
  }

  const logEmb = logEmbed(
    'Yeniden Çekiliş',
    `**Ödül:** ${veri.odul}\n**Yeni Kazanan(lar):** ${kazananlar.length ? kazananlar.map(k => `<@${k}>`).join(', ') : 'Yok'}`,
    RENKLER.UYARI,
  );
  await logGonder(client, guildId, logEmb);

  return { basari: true, kazananlar };
}

// ─── Aktif Çekilişleri Yeniden Yükle (Bot yeniden başlatılınca) ──
async function aktifCekilisleriYukle(client) {
  const tumCekilisler = cekilisler();
  let sayac = 0;

  for (const [mesajId, veri] of Object.entries(tumCekilisler)) {
    if (veri.bitti) continue;

    const kalan = veri.bitisTarihi - Date.now();
    if (kalan <= 0) {
      await cekilisiBitir(client, mesajId);
    } else {
      setTimeout(() => cekilisiBitir(client, mesajId), kalan);
      sayac++;
    }
  }

  if (sayac > 0) console.log(`[ÇEKİLİŞ] ${sayac} aktif çekiliş yeniden yüklendi.`);
}

module.exports = {
  sureyiCevir,
  sureMetni,
  cekilisBaslat,
  cekilisiBitir,
  yenidenCek,
  aktifCekilisleriYukle,
  kazananlariSec,
};
