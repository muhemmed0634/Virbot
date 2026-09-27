// ==========================================
//  VirBot — voiceStateUpdate Olayı
//  Geçici (Join-to-Create) Ses Kanalları & Ses Denetim Logları
//  %100 Türkçe · Senkronize Temizlik
// ==========================================
'use strict';

const { ayarGetir, tempVoiceKaydet, tempVoiceSil, tempVoiceGetir } = require('../modules/data/dataManager');
const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { muzikDurdur } = require('../modules/music/muzikManager');
const { RENKLER } = require('../config/config');
const {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

/**
 * Geçici ses kanalının boş olup olmadığını kontrol eder.
 * Kanalda gerçek insan kalmamışsa VirBot'u durdurur, ayırır ve kanalı siler.
 */
async function tempKanalTemizle(client, guild, kanalId, tetikleyen = 'Kanal boşaldı') {
  if (!guild || !kanalId) return;

  const ayarlar = ayarGetir(guild.id);

  // Giriş / Oluşturucu kanal asla silinemez!
  if (ayarlar?.sesOlusturKanalId && kanalId === ayarlar.sesOlusturKanalId) {
    return;
  }

  // 1. Önce bu kanalın VirBot tarafından oluşturulmuş bir geçici kanal olup olmadığını kontrol et
  const isRegisteredTemp = !!tempVoiceGetir(kanalId);

  const kanal = guild.channels.cache.get(kanalId) || await guild.channels.fetch(kanalId).catch(() => null);
  if (!kanal) {
    tempVoiceSil(kanalId);
    return;
  }

  // Güvenlik: Yalnızca kayıtlı geçici odaları veya VirBot'un oda desenine ve üyeye özel Yönetici izinlerine sahip kanalları geçici kabul et
  const isFallbackTemp = !isRegisteredTemp &&
    kanal.name.startsWith('🔊 ') &&
    kanal.name.includes('Odası') &&
    kanal.permissionOverwrites.cache.some(po => po.type === 1 && po.allow.has(PermissionFlagsBits.ManageChannels));

  // Eğer ne kayıtlı bir geçici odaysa ne de bu özel desene sahipse: BU BİR NORMAL SUNUCU KANALIDIR, ASLA SİLME!
  if (!isRegisteredTemp && !isFallbackTemp) {
    return;
  }

  // Kanaldaki gerçek insanları filtrele (Botlar sayılmaz!)
  const insanUyeler = kanal.members.filter(m => !m.user.bot);

  // Kanalda insan varsa ASLA silme
  if (insanUyeler.size > 0) {
    return;
  }

  // Kanalda hiçbir gerçek insan kalmadıysa
  const kanalAdi = kanal.name;
  const botKanal = guild.members.me?.voice?.channel;
  const botBuKanalda = botKanal && botKanal.id === kanal.id;

  // VirBot bu kanaldaysa önce müziği durdur ve bağlantıyı tamamen kes
  if (botBuKanalda || (getVoiceConnection(guild.id) && botKanal?.id === kanal.id)) {
    try {
      await muzikDurdur(guild.id, guild);
    } catch (err) {
      console.error('[SES KANALI] Müzik durdurma hatası:', err.message);
    }
    // Discord Gateway senkronizasyonu için kısa bekleme
    await new Promise(r => setTimeout(r, 600));
  }

    try {
      await kanal.delete();
      tempVoiceSil(kanalId);

      // Log gönder (Sistemde tutulmaz)
      const silinmeLog = logEmbed(
        '🗑️ Geçici Ses Kanalı Silindi',
        `**Kanal Adı:** \`${kanalAdi}\`\n` +
        `**Durum:** Kanalda hiç kullanıcı kalmadığı için otomatik olarak silindi.\n` +
        `**Tetikleyici:** ${tetikleyen}\n` +
        `**VirBot Durumu:** ${botBuKanalda ? 'Bot kanaldan ayrıldı ve durduruldu' : 'Bağlı değildi'}`,
        RENKLER.UYARI || 0xFEE75C
      );
      await logGonder(client, guild.id, silinmeLog);
    } catch (silmeHata) {
      console.error('[SES KANALI] Kanal silme hatası:', silmeHata.message);
    }
  }
}

module.exports = {
  isim: 'voiceStateUpdate',

  async calistir(client, oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const member = newState.member || oldState.member;
    const ayarlar = ayarGetir(guild.id);

    // ──────────────────────────────────────────────────────────
    // 1. ÜYE "➕ KANAL OLUŞTUR" KANALINA KATILDI
    // ──────────────────────────────────────────────────────────
    if (ayarlar?.sesOlusturKanalId && newState.channelId === ayarlar.sesOlusturKanalId && member && !member.user.bot) {
      try {
        const kategoriId = ayarlar.sesKategoriId || newState.channel?.parentId || null;
        const kullaniciAdi = member.displayName || member.user.username;

        // Kullanıcıya özel geçici ses odası oluştur
        const yeniKanal = await guild.channels.create({
          name: `🔊 ${kullaniciAdi}'ın Odası`,
          type: ChannelType.GuildVoice,
          parent: kategoriId,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak],
            },
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
              ],
            },
          ],
        });

        // Üyeyi yeni odaya taşı
        await newState.setChannel(yeniKanal);

        // Önbelleğe ve veritabanına kaydet (kanalId -> sahipId, guildId)
        tempVoiceKaydet(yeniKanal.id, member.id, guild.id);

        // Kontrol butonları (Tamamı Türkçe)
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ses_kilit').setEmoji('🔒').setLabel('Kilitle').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ses_ac').setEmoji('🔓').setLabel('Kilidi Aç').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('ses_gizle').setEmoji('👻').setLabel('Gizle').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ses_goster').setEmoji('👁️').setLabel('Göster').setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ses_limit').setEmoji('👥').setLabel('Kişi Limiti').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ses_ad').setEmoji('✏️').setLabel('Adı Değiştir').setStyle(ButtonStyle.Secondary)
        );

        await yeniKanal.send({
          content: `${member}, özel ses kanalınız oluşturuldu!\nAşağıdaki butonları kullanarak odanızı yönetebilirsiniz. Kanal boşaldığında otomatik olarak silinecektir.`,
          components: [row1, row2],
        }).catch(() => {});

        // Log gönder (Sistemde tutulmaz)
        const olusumLog = logEmbed(
          '➕ Geçici Ses Kanalı Oluşturuldu',
          `**Sahibi:** ${member} (\`${member.user.tag}\`)\n` +
          `**Kanal:** ${yeniKanal} (\`${yeniKanal.name}\`)\n` +
          `**Kategori:** \`${yeniKanal.parent ? yeniKanal.parent.name : 'Yok'}\``,
          RENKLER.BASARI || 0x57F287
        );
        await logGonder(client, guild.id, olusumLog);

      } catch (err) {
        console.error('[SES KANALI] Geçici kanal oluşturma hatası:', err.message);
      }
    }

    // ──────────────────────────────────────────────────────────
    // 2. GEÇİCİ SES KANALI TEMİZLİĞİ (VİRBOT VE BOŞALMA KONTROLÜ)
    // ──────────────────────────────────────────────────────────
    // 2A: Bir üye bir kanaldan ayrıldıysa veya kanal değiştirdiyse
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      await tempKanalTemizle(client, guild, oldState.channelId, 'Kullanıcı kanaldan ayrıldı');
      // Discord API ve gateway senkronizasyonu için gecikmeli ikinci güvenlik kontrolü
      setTimeout(() => {
        tempKanalTemizle(client, guild, oldState.channelId, 'Eşzamansız kontrol').catch(() => {});
      }, 1500);
    }

    // 2B: VirBot'un kendisi kanaldan ayrıldıysa
    if (oldState.member?.id === client.user?.id && oldState.channelId && oldState.channelId !== newState.channelId) {
      await tempKanalTemizle(client, guild, oldState.channelId, 'VirBot kanaldan ayrıldı');
      setTimeout(() => {
        tempKanalTemizle(client, guild, oldState.channelId, 'VirBot çıkış kontrolü').catch(() => {});
      }, 1500);
    }

    // ──────────────────────────────────────────────────────────
    // 3. GENEL SES DENETİM LOGLARI (SİSTEMDE TUTULMADAN GÖNDERİLİR)
    // ──────────────────────────────────────────────────────────
    if (!member || member.user.bot) return;

    // 3A: Kanal Değiştirme
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      if (newState.channelId !== ayarlar?.sesOlusturKanalId) {
        const logEmb = logEmbed(
          '🔄 Ses Kanalı Değiştirildi',
          `**Kullanıcı:** ${member} (\`${member.user.tag}\`)\n` +
          `**Eski Kanal:** \`${oldState.channel?.name || oldState.channelId}\`\n` +
          `**Yeni Kanal:** <#${newState.channelId}> (\`${newState.channel?.name}\`)`,
          RENKLER.BILGI || 0x5865F2
        );
        await logGonder(client, guild.id, logEmb);
      }
    }
    // 3B: Ses Kanalına Giriş
    else if (!oldState.channelId && newState.channelId) {
      if (newState.channelId !== ayarlar?.sesOlusturKanalId) {
        const logEmb = logEmbed(
          '📥 Ses Kanalına Katıldı',
          `**Kullanıcı:** ${member} (\`${member.user.tag}\`)\n` +
          `**Kanal:** <#${newState.channelId}> (\`${newState.channel?.name}\`)`,
          RENKLER.BASARI || 0x57F287
        );
        await logGonder(client, guild.id, logEmb);
      }
    }
    // 3C: Ses Kanalından Çıkış
    else if (oldState.channelId && !newState.channelId) {
      const logEmb = logEmbed(
        '📤 Ses Kanalından Ayrıldı',
        `**Kullanıcı:** ${member} (\`${member.user.tag}\`)\n` +
        `**Kanal:** \`${oldState.channel?.name || oldState.channelId}\``,
        RENKLER.HATA || 0xED4245
      );
      await logGonder(client, guild.id, logEmb);
    }

    // 3D: Mikrofon / Kulaklık Durum Değişikliği (Mute / Deafen)
    if (oldState.channelId && newState.channelId && oldState.channelId === newState.channelId) {
      const degisiklikler = [];
      if (oldState.selfMute !== newState.selfMute) {
        degisiklikler.push(newState.selfMute ? '🔇 Mikrofonunu Kapattı' : '🎙️ Mikrofonunu Açtı');
      }
      if (oldState.selfDeaf !== newState.selfDeaf) {
        degisiklikler.push(newState.selfDeaf ? '🎧 Kulaklığını Kapattı' : '🔊 Kulaklığını Açtı');
      }
      if (oldState.serverMute !== newState.serverMute) {
        degisiklikler.push(newState.serverMute ? '🛑 Sunucu Tarafından Susturuldu' : '✅ Sunucu Susturması Kaldırıldı');
      }
      if (oldState.serverDeaf !== newState.serverDeaf) {
        degisiklikler.push(newState.serverDeaf ? '🛑 Sunucu Tarafından Sağırlaştırıldı' : '✅ Sunucu Sağırlaştırması Kaldırıldı');
      }

      if (degisiklikler.length > 0) {
        const logEmb = logEmbed(
          '🎙️ Ses Durumu Güncellendi',
          `**Kullanıcı:** ${member} (\`${member.user.tag}\`)\n` +
          `**Kanal:** <#${newState.channelId}>\n` +
          `**Eylemler:** ${degisiklikler.join(' • ')}`,
          0x5865F2
        );
        await logGonder(client, guild.id, logEmb);
      }
    }
  },
};
