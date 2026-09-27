// ==========================================
//  VirBot — Müzik Yöneticisi (v7 · Tam Optimize)
//  yt-dlp Stream & Render 512MB RAM Koruma
//  @discordjs/voice · %100 Türkçe
// ==========================================
'use strict';

const {
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
  getVoiceConnection,
} = require('@discordjs/voice');

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { videoBilgiGetir, streamOlustur } = require('./ytdlpHelper');
const { logEmbed, logGonder } = require('../logger/logManager');

// ─── Sunucu Kuyruk Haritası ────────────────────────────────────
// guildId → { kuyruk, oynatici, baglanti, mevcutParca,
//              metinKanali, loop, ses, childProcess,
//              baslangicZamani, islemde, bostaZamanlayici }
const sunucuKuyrugu = new Map();

// ─────────────────────────────────────────────────────────────
// YARDIMCI BİÇİMLENDİRME FONKSİYONLARI
// ─────────────────────────────────────────────────────────────

/** Saniyeyi SS:DD veya SS:DD:SN formatına çevirir */
function sureFormati(saniye) {
  if (!saniye || isNaN(saniye) || saniye < 0) return '00:00';
  const sa = Math.floor(saniye / 3600);
  const dk = Math.floor((saniye % 3600) / 60);
  const sn = Math.floor(saniye % 60);
  if (sa > 0) {
    return `${sa}:${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
  }
  return `${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
}

/** Dinamik ilerleme çubuğu */
function ilerlemeCubugu(gecenSn, toplamSn, uzunluk = 14) {
  if (!toplamSn || toplamSn <= 0) return '🔴 Canlı Yayın';
  const oran = Math.min(1, Math.max(0, gecenSn / toplamSn));
  const dolu = Math.round(uzunluk * oran);
  const bos  = Math.max(0, uzunluk - dolu);
  return '▬'.repeat(Math.max(0, dolu - 1)) + '🔘' + '▬'.repeat(bos);
}

/** URL türü tespiti */
function urlTurTespit(url) {
  if (!url) return 'arama';
  if (url.includes('spotify.com/track/'))    return 'spotify_track';
  if (url.includes('spotify.com/playlist/')) return 'spotify_playlist';
  if (url.includes('spotify.com/album/'))    return 'spotify_album';
  if (url.includes('youtube.com/playlist') || url.includes('&list=')) return 'youtube_playlist';
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) return 'youtube';
  return 'arama';
}

// ─────────────────────────────────────────────────────────────
// MÜZİK KONTROL BUTONLARI
// ─────────────────────────────────────────────────────────────

function muzikKontrolButonlari(loop = false, duraklatildi = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('muzik_toggle')
        .setEmoji(duraklatildi ? '▶️' : '⏸️')
        .setLabel(duraklatildi ? 'Devam' : 'Duraklat')
        .setStyle(duraklatildi ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('muzik_atla')
        .setEmoji('⏭️')
        .setLabel('Atla')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('muzik_loop')
        .setEmoji('🔁')
        .setLabel(loop ? 'Döngü: Açık' : 'Döngü: Kapalı')
        .setStyle(loop ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('muzik_karistir')
        .setEmoji('🔀')
        .setLabel('Karıştır')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('muzik_durdur')
        .setEmoji('⏹️')
        .setLabel('Durdur')
        .setStyle(ButtonStyle.Danger),
    ),
  ];
}

// ─────────────────────────────────────────────────────────────
// ŞİMDİ ÇALIYOR EMBEDİ
// ─────────────────────────────────────────────────────────────

function simdiCaliyorEmbed(parca, kuyrukUzunluk, loop, ses = 80) {
  return new EmbedBuilder()
    .setTitle('🎵 Şu Anda Çalıyor')
    .setDescription(`**[${parca.baslik}](${parca.gercekUrl || parca.sorgu})**`)
    .addFields(
      { name: '⏱️ Süre',     value: `\`${sureFormati(parca.sure)}\``,              inline: true },
      { name: '📋 Kuyruk',   value: `\`${kuyrukUzunluk} parça\``,                   inline: true },
      { name: '🔁 Döngü',    value: loop ? '`✅ Açık`' : '`❌ Kapalı`',             inline: true },
      { name: '🔉 Ses',      value: `\`%${ses}\``,                                  inline: true },
      { name: '👤 İsteyen',  value: `\`${parca.isteyenAd || 'Anonim'}\``,           inline: true },
    )
    .setColor(0x1DB954)
    .setThumbnail(parca.thumbnail || null)
    .setFooter({ text: 'Aşağıdaki butonlarla müziği kontrol edebilirsiniz 🎧' })
    .setTimestamp();
}

// ─────────────────────────────────────────────────────────────
// SÜREÇ VE BELLEK TEMİZLEME YARDIMCISI (512MB RAM KORUMASI)
// ─────────────────────────────────────────────────────────────

function processTemizle(durum) {
  if (!durum) return;

  if (durum.bostaZamanlayici) {
    clearTimeout(durum.bostaZamanlayici);
    durum.bostaZamanlayici = null;
  }

  if (durum.childProcess) {
    try {
      durum.childProcess.stdout?.destroy();
      durum.childProcess.stderr?.destroy();
      durum.childProcess.kill('SIGKILL');
    } catch (_) {}
    durum.childProcess = null;
  }

  if (durum.mevcutKaynak) {
    try {
      durum.mevcutKaynak.playStream?.destroy();
    } catch (_) {}
    durum.mevcutKaynak = null;
  }
}

// ─────────────────────────────────────────────────────────────
// SIRADAKİ PARÇAYI ÇAL
// ─────────────────────────────────────────────────────────────

async function sonrakiCal(guildId, metinKanali) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return;

  // Race condition engelle
  if (durum.islemde) return;
  durum.islemde = true;

  // Eski süreçleri ve akışları kapat (Bellek sızıntısını önle)
  processTemizle(durum);

  // Döngü modu açıksa ve atlanmamışsa eski parçayı kuyruğun sonuna ekle
  if (durum.loop && durum.mevcutParca && !durum.atlandi) {
    durum.kuyruk.push({ ...durum.mevcutParca });
  }
  durum.atlandi = false;

  // Kuyruk boş mu?
  if (durum.kuyruk.length === 0) {
    durum.mevcutParca     = null;
    durum.baslangicZamani = null;
    durum.islemde         = false;

    const kanal = metinKanali || durum.metinKanali;
    if (kanal) {
      kanal.send('🎵 Kuyruk tamamlandı. 2 dakika içinde yeni şarkı eklenmezse ses kanalından ayrılacağım.').catch(() => {});
    }

    // 2 dakika sonra hâlâ boşsa ses kanalından ayrıl (512MB RAM tasarrufu)
    durum.bostaZamanlayici = setTimeout(() => {
      const d = sunucuKuyrugu.get(guildId);
      if (d && d.kuyruk.length === 0 && !d.mevcutParca) {
        muzikDurdur(guildId, kanal?.guild);
      }
    }, 2 * 60 * 1000);
    return;
  }

  const parca = durum.kuyruk.shift();
  durum.mevcutParca = parca;

  try {
    // Parçanın doğrudan linki henüz yoksa veya arama sorgusuysa al
    let ytUrl = parca.gercekUrl;
    if (!ytUrl || !ytUrl.startsWith('http')) {
      const meta = await videoBilgiGetir(parca.sorgu);
      parca.baslik    = meta.baslik || parca.baslik;
      parca.gercekUrl = meta.ytUrl;
      parca.sure      = meta.sure || parca.sure;
      parca.thumbnail = meta.thumbnail || parca.thumbnail;
      ytUrl = meta.ytUrl;
    }

    const { kaynak, child } = streamOlustur(ytUrl);
    durum.childProcess    = child;
    durum.mevcutKaynak    = kaynak;
    durum.baslangicZamani = Date.now();

    // Ses seviyesini uygula
    if (kaynak.volume) {
      kaynak.volume.setVolume((durum.ses || 80) / 100);
    }

    durum.oynatici.play(kaynak);

    const kanal = metinKanali || durum.metinKanali;
    if (kanal) {
      const embed = simdiCaliyorEmbed(parca, durum.kuyruk.length, durum.loop, durum.ses);
      const components = muzikKontrolButonlari(durum.loop, false);
      kanal.send({ embeds: [embed], components }).catch(() => {});

      // Ses Logu
      if (kanal.client && kanal.guild) {
        logGonder(kanal.client, kanal.guild.id, logEmbed(
          '🎵 Şarkı Başlatıldı',
          `**Şarkı:** [${parca.baslik}](${parca.gercekUrl})\n` +
          `**Ses Kanalı:** <#${durum.baglanti?.joinConfig?.channelId || 'Bilinmiyor'}>\n` +
          `**İsteyen:** \`${parca.isteyenAd || 'Anonim'}\`\n` +
          `**Süre:** \`${sureFormati(parca.sure)}\``,
          0x1DB954
        ));
      }
    }
  } catch (hata) {
    console.error('[MÜZİK OYNATMA HATA]:', hata.message);
    const kanal = metinKanali || durum.metinKanali;
    if (kanal) {
      kanal.send(`❌ **${parca.baslik || 'Parça'}** çalınırken hata oluştu, sıradakine geçiliyor...`).catch(() => {});
    }
    durum.islemde = false;
    setTimeout(() => sonrakiCal(guildId, metinKanali), 1000);
    return;
  }

  durum.islemde = false;
}

// ─────────────────────────────────────────────────────────────
// ANA ÇALMA FONKSİYONU
// ─────────────────────────────────────────────────────────────

async function muzikOynat(guildId, voiceKanal, metinKanali, sorgu, isteyenAd) {
  try {
    const metaSonuc = await videoBilgiGetir(sorgu);
    const eklenecekler = [];

    if (metaSonuc.isPlaylist && Array.isArray(metaSonuc.parcalar)) {
      for (const p of metaSonuc.parcalar) {
        eklenecekler.push({
          sorgu: p.ytUrl || p.baslik,
          baslik: p.baslik,
          gercekUrl: p.ytUrl,
          sure: p.sure,
          thumbnail: p.thumbnail,
          isteyenAd,
        });
      }
      if (metinKanali) {
        metinKanali.send(`📋 Çalma listesinden **${eklenecekler.length}** şarkı kuyruğa eklendi.`).catch(() => {});
      }
    } else {
      eklenecekler.push({
        sorgu,
        baslik: metaSonuc.baslik || sorgu,
        gercekUrl: metaSonuc.ytUrl || sorgu,
        sure: metaSonuc.sure || 0,
        thumbnail: metaSonuc.thumbnail || null,
        isteyenAd,
      });
    }

    let durum = sunucuKuyrugu.get(guildId);

    // Yeni bağlantı oluştur
    if (!durum) {
      const baglanti = joinVoiceChannel({
        channelId: voiceKanal.id,
        guildId,
        adapterCreator: voiceKanal.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      try {
        await entersState(baglanti, VoiceConnectionStatus.Ready, 15_000);
      } catch {
        try { baglanti.destroy(); } catch (_) {}
        if (metinKanali) {
          metinKanali.send('❌ Ses kanalına bağlanılamadı! Botun kanal izinlerini kontrol edin.').catch(() => {});
        }
        return false;
      }

      const oynatici = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
      });

      baglanti.subscribe(oynatici);

      durum = {
        kuyruk: [],
        oynatici,
        baglanti,
        mevcutParca:     null,
        mevcutKaynak:    null,
        metinKanali,
        loop:            false,
        atlandi:         false,
        ses:             80,
        childProcess:    null,
        baslangicZamani: null,
        islemde:         false,
        bostaZamanlayici: null,
      };

      sunucuKuyrugu.set(guildId, durum);

      // Bağlantı kopma kontrolü
      baglanti.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(baglanti, VoiceConnectionStatus.Signalling, 5_000),
            entersState(baglanti, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          muzikDurdur(guildId, voiceKanal.guild);
        }
      });

      baglanti.on(VoiceConnectionStatus.Destroyed, () => {
        const d = sunucuKuyrugu.get(guildId);
        if (d) processTemizle(d);
        sunucuKuyrugu.delete(guildId);
      });

      // Parça bittiğinde
      oynatici.on(AudioPlayerStatus.Idle, () => {
        const d = sunucuKuyrugu.get(guildId);
        if (d && !d.islemde) {
          sonrakiCal(guildId, d.metinKanali);
        }
      });

      // Oynatıcı hatası
      oynatici.on('error', (hata) => {
        console.error('[OYNATICI HATA]:', hata.message);
        const d = sunucuKuyrugu.get(guildId);
        if (d) {
          d.islemde = false;
          setTimeout(() => sonrakiCal(guildId, d.metinKanali), 1000);
        }
      });
    }

    durum.metinKanali = metinKanali;
    durum.kuyruk.push(...eklenecekler);

    // Boştaysa çalmaya başla, değilse bilgi ver
    if (durum.oynatici.state.status === AudioPlayerStatus.Idle && !durum.islemde) {
      await sonrakiCal(guildId, metinKanali);
    } else {
      if (metinKanali && !metaSonuc.isPlaylist) {
        const embed = new EmbedBuilder()
          .setTitle('📋 Kuyruğa Eklendi')
          .setDescription(`🎶 **[${eklenecekler[0].baslik}](${eklenecekler[0].gercekUrl || eklenecekler[0].sorgu})**`)
          .addFields(
            { name: '📊 Sıra', value: `\`${durum.kuyruk.length}. sırada\``, inline: true },
            { name: '⏱️ Süre', value: `\`${sureFormati(eklenecekler[0].sure)}\``, inline: true },
          )
          .setColor(0x1DB954)
          .setTimestamp();
        metinKanali.send({ embeds: [embed] }).catch(() => {});
      }
    }

    return true;
  } catch (err) {
    console.error('[MÜZİK OYNAT HATA]:', err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// KONTROL VE YÖNETİM FONKSİYONLARI
// ─────────────────────────────────────────────────────────────

async function muzikDurdur(guildId, guild = null) {
  const durum = sunucuKuyrugu.get(guildId);
  const client = guild?.client || durum?.metinKanali?.client;
  const sonParca = durum?.mevcutParca?.baslik || null;

  if (durum) {
    processTemizle(durum);
    try { durum.oynatici.stop(true); } catch (_) {}
    try { durum.baglanti.destroy(); } catch (_) {}
    sunucuKuyrugu.delete(guildId);
  }

  // Aktif voice connection varsa yok et
  try {
    const conn = getVoiceConnection(guildId);
    if (conn) conn.destroy();
  } catch (_) {}

  // Bot ses bağlantısını kes
  if (guild) {
    try {
      await guild.members.me?.voice?.disconnect();
    } catch (_) {}
  }

  // Denetim Logu
  if (client) {
    logGonder(client, guildId, logEmbed(
      '⏹️ Müzik Durduruldu',
      `**Sunucu:** \`${guild?.name || guildId}\`\n` +
      `**Durum:** Müzik durduruldu, bellek temizlendi ve ses kanalından ayrıldım.` +
      (sonParca ? `\n**Son Çalınan:** \`${sonParca}\`` : ''),
      0xED4245
    ));
  }

  return true;
}

function muzikAtla(guildId, kullanici = null) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;

  const atlananBaslik = durum.mevcutParca?.baslik || 'Mevcut parça';

  // Atlama sırasında döngüyü mevcut parçaya işletme
  durum.atlandi = true;
  durum.islemde = false;

  processTemizle(durum);
  durum.oynatici.stop();

  const client = durum.metinKanali?.client;
  if (client) {
    logGonder(client, guildId, logEmbed(
      '⏭️ Şarkı Atlandı',
      `**Atlanan:** \`${atlananBaslik}\`\n` +
      `**İşlemi Yapan:** ${kullanici ? (kullanici.tag || kullanici.username) : 'Kullanıcı'}`,
      0x5865F2
    ));
  }

  return true;
}

function muzikDuraklat(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  if (durum.oynatici.state.status !== AudioPlayerStatus.Playing) return false;
  durum.oynatici.pause();
  return true;
}

function muzikDevamEt(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  if (durum.oynatici.state.status !== AudioPlayerStatus.Paused) return false;
  durum.oynatici.unpause();
  return true;
}

function muzikLoop(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return null;
  durum.loop = !durum.loop;
  return durum.loop;
}

function muzikSes(guildId, seviye) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  const normalSeviye = Math.max(0, Math.min(100, seviye));
  durum.ses = normalSeviye;
  try {
    const kaynak = durum.oynatici.state.resource;
    if (kaynak?.volume) {
      kaynak.volume.setVolume(normalSeviye / 100);
    }
  } catch (_) {}
  return true;
}

function muzikKaristir(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum || !Array.isArray(durum.kuyruk) || durum.kuyruk.length <= 1) return 0;
  // Fisher-Yates karıştırma algoritması (Hatasız)
  for (let i = durum.kuyruk.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = durum.kuyruk[i];
    durum.kuyruk[i] = durum.kuyruk[j];
    durum.kuyruk[j] = temp;
  }
  return durum.kuyruk.length;
}

function muzikKuyrukTemizle(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return 0;
  const sayi = durum.kuyruk.length;
  durum.kuyruk = [];
  return sayi;
}

function kurukuGetir(guildId) {
  return sunucuKuyrugu.get(guildId) || null;
}

// ─────────────────────────────────────────────────────────────
// DIŞA AKTARIM
// ─────────────────────────────────────────────────────────────

module.exports = {
  muzikOynat,
  muzikDurdur,
  muzikAtla,
  muzikDuraklat,
  muzikDevamEt,
  muzikLoop,
  muzikSes,
  muzikKaristir,
  muzikKuyrukTemizle,
  kurukuGetir,
  sureFormati,
  ilerlemeCubugu,
  urlTurTespit,
  muzikKontrolButonlari,
};
