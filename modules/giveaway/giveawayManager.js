// ==========================================
//  VirBot — Çekiliş Yöneticisi (Beta Sürümü)
//  Sadeleştirilmiş, dinamik ve hatasız
// ==========================================
'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const {
  cekilisGetir,
  cekilisKaydet,
  cekilisSil,
  cekilisler,
  cekilisleriYukle,
} = require('../data/dataManager');
const { logGonder, logEmbed } = require('../logger/logManager');

// ─── Süre Çevirici ──────────────────────────────────────────
function sureyiCevir(metin) {
  if (!metin || typeof metin !== 'string') return null;
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
  return [d && `${d}g`, h && `${h}sa`, m && `${m}dk`, s && `${s}sn`].filter(Boolean).join(' ') || '1sn';
}

// ─── Sade & Beta Embed Oluşturucu ──────────────────────────
function cekilisEmbedOlustur(veri, bitti = false, kazananlar = []) {
  const bitisSaniye = Math.floor(veri.bitisTarihi / 1000);
  const katilimciSayisi = veri.katilimcilar?.length || 0;

  const embed = new EmbedBuilder()
    .setTitle(bitti ? '🎉 Çekiliş Sona Erdi (Beta)' : '🎉 Çekiliş (Beta)')
    .setColor(bitti ? 0x2B2D31 : 0x5865F2)
    .setFooter({ text: 'VirBot Çekiliş Sistemi • Beta' })
    .setTimestamp();

  if (!bitti) {
    embed.setDescription(
      `### 🎁 Ödül: **${veri.odul}**\n\n` +
      `⏱️ **Bitiş:** <t:${bitisSaniye}:R> (<t:${bitisSaniye}:t>)\n` +
      `👑 **Kazanan Sayısı:** \`${veri.kazananSayisi} kişi\`\n` +
      `👥 **Katılımcı:** \`${katilimciSayisi} kişi\`\n` +
      (veri.baslatan ? `👤 **Başlatan:** <@${veri.baslatan}>\n` : '') +
      `\nÇekilişe katılmak veya ayrılmak için aşağıdaki **🎉 Katıl** düğmesine tıklayın!`
    );
  } else {
    const kazananMetin = kazananlar.length
      ? kazananlar.map(k => `<@${k}>`).join(', ')
      : '*Katılımcı bulunamadı.*';

    embed.setDescription(
      `### 🎁 Ödül: **${veri.odul}**\n\n` +
      `🏆 **Kazanan(lar):** ${kazananMetin}\n` +
      `👥 **Toplam Katılımcı:** \`${katilimciSayisi} kişi\`\n` +
      (veri.baslatan ? `👤 **Başlatan:** <@${veri.baslatan}>\n` : '') +
      `\nÇekiliş başarıyla tamamlanmıştır.`
    );
  }

  return embed;
}

// ─── Buton Bileşenleri ─────────────────────────────────────
function cekilisButonlari(mesajId, katilimciSayisi = 0) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cekilise_katil_${mesajId}`)
      .setLabel(`🎉 Katıl (${katilimciSayisi})`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`cekilisi_bitir_${mesajId}`)
      .setLabel('⏹️ Bitir')
      .setStyle(ButtonStyle.Secondary)
  );
}

// ─── Kazanan Seçimi ────────────────────────────────────────
function kazananlariSec(katilimcilar, adet) {
  if (!katilimcilar || katilimcilar.length === 0) return [];
  const havuz = [...new Set(katilimcilar)];
  const karistir = havuz.sort(() => Math.random() - 0.5);
  return karistir.slice(0, Math.min(adet, karistir.length));
}

// ─── Çekiliş Başlatma ──────────────────────────────────────
async function cekilisBaslat(client, secenekler) {
  try {
    let kanalId, guildId, odul, kazananSayisi, sureMs, baslatan;

    // Nesne veya sıralı parametre desteği
    if (secenekler && typeof secenekler === 'object' && secenekler.odul) {
      kanalId = secenekler.kanalId;
      guildId = secenekler.guildId;
      odul = secenekler.odul;
      kazananSayisi = secenekler.kazananSayisi || 1;
      sureMs = secenekler.sureMs;
      baslatan = secenekler.baslatanId || secenekler.baslatan;
    } else {
      // Legacy uyumluluk: cekilisBaslat(kanal, odul, kazanan, sure, baslatan)
      const kanal = client;
      kanalId = kanal.id;
      guildId = kanal.guild.id;
      odul = secenekler;
      kazananSayisi = arguments[2] || 1;
      sureMs = arguments[3] || 60000;
      baslatan = arguments[4]?.id || null;
      client = kanal.client;
    }

    const kanal = await client.channels.fetch(kanalId).catch(() => null);
    if (!kanal) return null;

    const bitisTarihi = Date.now() + sureMs;

    const veri = {
      kanalId,
      guildId,
      baslatan,
      odul,
      kazananSayisi,
      bitisTarihi,
      katilimcilar: [],
      bitti: false,
    };

    const embed = cekilisEmbedOlustur(veri);
    const butonlar = cekilisButonlari('hazirlaniyor', 0);

    const mesaj = await kanal.send({
      embeds: [embed],
      components: [butonlar],
    });

    veri.mesajId = mesaj.id;
    cekilisKaydet(mesaj.id, veri);

    // Düğme ID'sini gerçek mesajId ile güncelle
    await mesaj.edit({
      components: [cekilisButonlari(mesaj.id, 0)],
    }).catch(() => {});

    // Süre bitimini zamanla
    setTimeout(() => cekilisiBitir(client, mesaj.id), sureMs);

    return mesaj;
  } catch (hata) {
    console.error('[ÇEKİLİŞ] Başlatma hatası:', hata);
    return null;
  }
}

// ─── Çekilişe Katıl / Ayrıl (Toggle) ───────────────────────
async function cekiliseKatil(interaction, mesajId) {
  try {
    const veri = cekilisGetir(mesajId);
    if (!veri || veri.bitti) {
      return interaction.reply({
        content: '❌ Bu çekiliş bulunamadı veya çoktan sona ermiş.',
        ephemeral: true,
      });
    }

    if (!Array.isArray(veri.katilimcilar)) {
      veri.katilimcilar = [];
    }

    const userId = interaction.user.id;
    const sira = veri.katilimcilar.indexOf(userId);
    let katildi = false;

    if (sira > -1) {
      // Zaten katılmış -> Çıkar
      veri.katilimcilar.splice(sira, 1);
      katildi = false;
    } else {
      // Katıl
      veri.katilimcilar.push(userId);
      katildi = true;
    }

    // Veritabanına ve Cache'e kaydet
    cekilisKaydet(mesajId, veri);

    // Mesaj bileşenlerini güncelle
    const guncelEmbed = cekilisEmbedOlustur(veri);
    const guncelButonlar = cekilisButonlari(mesajId, veri.katilimcilar.length);

    await interaction.message.edit({
      embeds: [guncelEmbed],
      components: [guncelButonlar],
    }).catch(() => {});

    if (katildi) {
      await interaction.reply({
        content: `🎉 **${veri.odul}** çekilişine başarıyla katıldınız! Şansınız bol olsun.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `ℹ️ **${veri.odul}** çekilişinden ayrıldınız.`,
        ephemeral: true,
      });
    }
  } catch (err) {
    console.error('[ÇEKİLİŞ] Katılım hatası:', err.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ İşlem sırasında bir hata oluştu.', ephemeral: true }).catch(() => {});
    }
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

    const bitisEmbed = cekilisEmbedOlustur(veri, true, kazananlar);

    if (mesaj) {
      await mesaj.edit({
        embeds: [bitisEmbed],
        components: [],
      }).catch(() => {});
    }

    if (kazananlar.length > 0) {
      await kanal.send({
        content: `🎊 **Tebrikler** ${kazananlar.map(k => `<@${k}>`).join(', ')}! **${veri.odul}** çekilişini kazandınız! 🎁`,
      });
    } else {
      await kanal.send({
        content: `😔 **${veri.odul}** çekilişinde katılımcı bulunamadığı için kazanan seçilemedi.`,
      });
    }

    // Log bildirimi
    const logEmb = logEmbed(
      'Çekiliş Tamamlandı (Beta)',
      `**Ödül:** ${veri.odul}\n**Kanal:** <#${veri.kanalId}>\n**Kazanan(lar):** ${kazananlar.length ? kazananlar.map(k => `<@${k}>`).join(', ') : 'Yok'}\n**Katılımcı:** ${veri.katilimcilar?.length || 0}`,
      RENKLER.BASARI,
    );
    await logGonder(client, veri.guildId, logEmb);
  } catch (hata) {
    console.error('[ÇEKİLİŞ] Bitirme hatası:', hata.message);
  }
}

// ─── Yeniden Kazanan Çek (Reroll) ──────────────────────────
async function yenidenCek(client, mesajId, guildId) {
  const veri = cekilisGetir(mesajId);
  if (!veri) return { basari: false, mesaj: 'Bu ID\'ye ait bir çekiliş bulunamadı.' };

  const kazananlar = kazananlariSec(veri.katilimcilar || [], veri.kazananSayisi);

  const kanal = await client.channels.fetch(veri.kanalId).catch(() => null);
  if (kanal) {
    if (kazananlar.length > 0) {
      await kanal.send({
        content: `🔄 **Yeniden Çekiliş!** **${veri.odul}** çekilişinin yeni kazananı: ${kazananlar.map(k => `<@${k}>`).join(', ')}! Tebrikler! 🎉`,
      });
    } else {
      await kanal.send({
        content: `😔 Yeniden çekilişte de katılımcı bulunamadı.`,
      });
    }
  }

  const logEmb = logEmbed(
    'Yeniden Çekiliş (Beta)',
    `**Ödül:** ${veri.odul}\n**Yeni Kazanan(lar):** ${kazananlar.length ? kazananlar.map(k => `<@${k}>`).join(', ') : 'Yok'}`,
    RENKLER.UYARI,
  );
  await logGonder(client, guildId, logEmb);

  return { basari: true, kazananlar };
}

// ─── Aktif Çekilişleri Yeniden Yükle ────────────────────────
async function aktifCekilisleriYukle(client) {
  try {
    const kayitlar = await cekilisleriYukle();
    let sayac = 0;

    for (const veri of kayitlar) {
      if (veri.bitti) continue;

      const kalan = veri.bitisTarihi - Date.now();
      if (kalan <= 0) {
        await cekilisiBitir(client, veri.mesajId);
      } else {
        setTimeout(() => cekilisiBitir(client, veri.mesajId), kalan);
        sayac++;
      }
    }

    if (sayac > 0) {
      console.log(`[ÇEKİLİŞ] ${sayac} aktif çekiliş veritabanından yüklendi ve zamanlandı.`);
    }
  } catch (err) {
    console.error('[ÇEKİLİŞ] Aktif çekilişler yüklenirken hata:', err.message);
  }
}

module.exports = {
  sureyiCevir,
  sureMetni,
  cekilisEmbedOlustur,
  cekilisButonlari,
  cekilisBaslat,
  cekiliseKatil,
  cekilisiBitir,
  yenidenCek,
  aktifCekilisleriYukle,
  kazananlariSec,
};
