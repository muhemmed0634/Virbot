// ==========================================
//  VirBot — interactionCreate Olayı (v2)
//  Slash Komutları, Butonlar (Ticket, Çekiliş, Ses)
// ==========================================
'use strict';

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { ticketAc, ticketKapat } = require('../modules/ticket/ticketManager');
const { cekiliseKatil, cekilisiBitir } = require('../modules/giveaway/giveawayManager');
const { yetkiliMi, yetkiRed } = require('../modules/permissions/permCheck');
const { logEmbed, logGonder } = require('../modules/logger/logManager');
const { RENKLER } = require('../config/config');

module.exports = {
  isim: 'interactionCreate',

  async calistir(client, interaction) {
    // ── 1. SLASH KOMUTLARI (ChatInputCommand) ──
    if (interaction.isChatInputCommand()) {
      const komut = client.komutlar.get(interaction.commandName);
      if (!komut) {
        return interaction.reply({
          content: '❌ Bu komut güncellendi. Lütfen `/giris` komutunu deneyin veya Discord uygulamanızı yenileyin (Ctrl+R).',
          ephemeral: true,
        }).catch(() => {});
      }

      // Yetki kontrolü: Yalnızca adminGerekli: true olan komutlar yetkili gerektirir
      if (komut.adminGerekli && !yetkiliMi(interaction.member)) {
        return yetkiRed(interaction);
      }


      try {
        if (komut.slashCalistir) {
          await komut.slashCalistir(client, interaction);
        } else if (komut.calistir) {
          await komut.calistir(client, interaction);
        }
      } catch (err) {
        console.error(`[SLASH HATA] /${interaction.commandName}:`, err);
        const replyFn = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
        await interaction[replyFn]({
          content: '❌ Komut yürütülürken beklenmedik bir hata oluştu.',
          ephemeral: true,
        }).catch(() => {});
      }
      return;
    }

    // ── 2. MODAL FORMLARI (ModalSubmitInteraction) ──
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;
      const { tempVoiceGetir, tempVoiceKaydet } = require('../modules/data/dataManager');

      if (customId === 'ses_modal_limit') {
        const kanal = interaction.member?.voice?.channel;
        if (!kanal) {
          return interaction.reply({ content: '❌ Bir ses kanalında olmanız gerekiyor!', ephemeral: true });
        }
        let sahipId = tempVoiceGetir(kanal.id);
        if (!sahipId) {
          tempVoiceKaydet(kanal.id, interaction.user.id);
          sahipId = interaction.user.id;
        }

        if (sahipId !== interaction.user.id && !yetkiliMi(interaction.member)) {
          return interaction.reply({ content: '❌ Bu ses kanalının sahibi siz değilsiniz!', ephemeral: true });
        }

        const girilen = interaction.fields.getTextInputValue('ses_limit_input').trim();
        const limit = parseInt(girilen, 10);
        if (isNaN(limit) || limit < 0 || limit > 99) {
          return interaction.reply({ content: '❌ Lütfen 0 ile 99 arasında geçerli bir sayı girin (0 = Limitsiz).', ephemeral: true });
        }

        try {
          await kanal.setUserLimit(limit);
          await interaction.reply({
            content: `👥 Kanal kişi limiti başarıyla **${limit === 0 ? 'Limitsiz (0)' : limit}** olarak ayarlandı.`,
            ephemeral: true,
          });

          // Log gönder (Sistemde tutulmaz)
          const limitLog = logEmbed(
            '👥 Geçici Ses Kanalı Limiti Değiştirildi',
            `**Kullanıcı:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
            `**Kanal:** \`${kanal.name}\` (<#${kanal.id}>)\n` +
            `**Yeni Limit:** \`${limit === 0 ? 'Limitsiz' : limit} kişi\``,
            RENKLER.BILGI || 0x5865F2
          );
          await logGonder(client, interaction.guild.id, limitLog);
        } catch (err) {
          interaction.reply({ content: '❌ Limit ayarlanırken hata oluştu: ' + err.message, ephemeral: true }).catch(() => {});
        }
        return;
      }

      if (customId === 'ses_modal_ad') {
        const kanal = interaction.member?.voice?.channel;
        if (!kanal) {
          return interaction.reply({ content: '❌ Bir ses kanalında olmanız gerekiyor!', ephemeral: true });
        }
        let sahipId = tempVoiceGetir(kanal.id);
        if (!sahipId) {
          tempVoiceKaydet(kanal.id, interaction.user.id);
          sahipId = interaction.user.id;
        }

        if (sahipId !== interaction.user.id && !yetkiliMi(interaction.member)) {
          return interaction.reply({ content: '❌ Bu ses kanalının sahibi siz değilsiniz!', ephemeral: true });
        }

        const yeniAd = interaction.fields.getTextInputValue('ses_ad_input').trim().slice(0, 32);
        if (!yeniAd) {
          return interaction.reply({ content: '❌ Lütfen geçerli bir kanal adı girin!', ephemeral: true });
        }

        try {
          const eskiAd = kanal.name;
          await kanal.setName(yeniAd);
          await interaction.reply({
            content: `✏️ Kanal adı başarıyla **${yeniAd}** olarak güncellendi.`,
            ephemeral: true,
          });

          // Log gönder (Sistemde tutulmaz)
          const adLog = logEmbed(
            '✏️ Geçici Ses Kanalı Adı Değiştirildi',
            `**Kullanıcı:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
            `**Eski Ad:** \`${eskiAd}\`\n` +
            `**Yeni Ad:** \`${yeniAd}\` (<#${kanal.id}>)`,
            RENKLER.BILGI || 0x5865F2
          );
          await logGonder(client, interaction.guild.id, adLog);
        } catch (err) {
          interaction.reply({ content: '❌ İsim güncellenirken hata oluştu: ' + err.message, ephemeral: true }).catch(() => {});
        }
        return;
      }
    }

    // ── 3. BUTONLAR (ButtonInteraction) ──
    if (interaction.isButton()) {
      const { customId } = interaction;

      // ── TICKET SİSTEMİ ──
      if (customId === 'ticket_ac') {
        await ticketAc(interaction);
      } else if (customId.startsWith('ticket_kapat_')) {
        const kanalId = customId.split('_')[2];
        if (!yetkiliMi(interaction.member)) {
          return yetkiRed(interaction);
        }
        await ticketKapat(interaction, kanalId);
      }

      // ── DOĞRULAMA SİSTEMİ ──
      else if (customId.startsWith('verify_')) {
        const rolId = customId.split('_')[1];
        const rol = interaction.guild.roles.cache.get(rolId);

        if (!rol) {
          return interaction.reply({
            content: '❌ Doğrulama rolü bulunamadı, sunucu yetkililerine haber verin.',
            ephemeral: true,
          });
        }

        if (interaction.member.roles.cache.has(rol.id)) {
          return interaction.reply({
            content: '✅ Zaten doğrulanmışsınız!',
            ephemeral: true,
          });
        }

        // Doğrulama rolünü ver
        await interaction.member.roles.add(rol).catch(console.error);

        // @NOT VERIFIED rolünü kaldır (varsa)
        const { ayarGetir } = require('../modules/data/dataManager');
        const gAyarlar = ayarGetir(interaction.guild.id);
        const yapilmayanRolId = gAyarlar?.verifyYapilmayanRoluId;
        if (yapilmayanRolId) {
          const yapilmayanRol = interaction.guild.roles.cache.get(yapilmayanRolId);
          if (yapilmayanRol && interaction.member.roles.cache.has(yapilmayanRolId)) {
            await interaction.member.roles.remove(yapilmayanRol, 'VirBot — Verify tamamlandı, NOT VERIFIED rolü alındı').catch(() => {});
          }
        } else {
          const otomatikRol = interaction.guild.roles.cache.find(r =>
            ['not verified', 'doğrulanmamış', 'unverified', 'dogrulanmamis']
              .includes(r.name.toLowerCase())
          );
          if (otomatikRol && interaction.member.roles.cache.has(otomatikRol.id)) {
            await interaction.member.roles.remove(otomatikRol, 'VirBot — Verify tamamlandı').catch(() => {});
          }
        }

        await interaction.reply({
          content: `✅ Başarıyla doğrulandınız ve **${rol.name}** rolünü aldınız!`,
          ephemeral: true,
        });
      }

      // ── ÇEKİLİŞ KATILIM (BETA) ──
      else if (customId.startsWith('cekilise_katil_') || customId.startsWith('cekilis_katil_')) {
        const cekilisMesajId = customId.replace('cekilise_katil_', '').replace('cekilis_katil_', '');
        await cekiliseKatil(interaction, cekilisMesajId);
      }

      // ── ÇEKİLİŞ ERKEN BİTİRME (ADMIN) ──
      else if (customId.startsWith('cekilisi_bitir_') || customId.startsWith('cekilis_bitir_')) {
        if (!yetkiliMi(interaction.member)) {
          return interaction.reply({
            content: '❌ Sadece yetkililer çekilişi erken sonlandırabilir.',
            ephemeral: true,
          });
        }
        const cekilisMesajId = customId.replace('cekilisi_bitir_', '').replace('cekilis_bitir_', '');
        await interaction.reply({ content: '⏹️ Çekiliş sonlandırılıyor...', ephemeral: true });
        await cekilisiBitir(client, cekilisMesajId);
      }

      // ── GEÇİCİ SES KONTROLLERİ ──
      else if (customId.startsWith('ses_')) {
        const komut = customId.split('_')[1];
        const kanal = interaction.member.voice.channel;

        if (!kanal) {
          return interaction.reply({
            content: '❌ Bu butonları kullanmak için bir ses kanalında olmalısınız.',
            ephemeral: true,
          });
        }

        const { tempVoiceGetir, tempVoiceKaydet } = require('../modules/data/dataManager');
        let sahipId = tempVoiceGetir(kanal.id);

        // Önbellek boşalmışsa (bot restart sonrası) ve kullanıcı odada tekse veya adında kullanıcı adı geçiyorsa sahipliği ver
        if (!sahipId) {
          tempVoiceKaydet(kanal.id, interaction.user.id, interaction.guild?.id || null);
          sahipId = interaction.user.id;
        }

        if (sahipId !== interaction.user.id && !yetkiliMi(interaction.member)) {
          return interaction.reply({
            content: '❌ Bu kanalın sahibi siz değilsiniz!',
            ephemeral: true,
          });
        }

        try {
          if (komut === 'kilit') {
            await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
            await interaction.reply({ content: '🔒 Kanalınız kilitlendi! Yeni kullanıcılar katılamaz.', ephemeral: true });

            const logEmb = logEmbed('🔒 Geçici Ses Kanalı Kilitlendi', `**Kullanıcı:** ${interaction.user} (\`${interaction.user.tag}\`)\n**Kanal:** \`${kanal.name}\` (<#${kanal.id}>)`, RENKLER.HATA || 0xED4245);
            await logGonder(client, interaction.guild.id, logEmb);

          } else if (komut === 'ac') {
            await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: true });
            await interaction.reply({ content: '🔓 Kanal kilidi açıldı! Herkes katılabilir.', ephemeral: true });

            const logEmb = logEmbed('🔓 Geçici Ses Kanalı Açıldı', `**Kullanıcı:** ${interaction.user} (\`${interaction.user.tag}\`)\n**Kanal:** \`${kanal.name}\` (<#${kanal.id}>)`, RENKLER.BASARI || 0x57F287);
            await logGonder(client, interaction.guild.id, logEmb);

          } else if (komut === 'gizle') {
            await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
            await interaction.reply({ content: '👻 Kanalınız gizlendi! Kanal listesinde görünmez.', ephemeral: true });

            const logEmb = logEmbed('👻 Geçici Ses Kanalı Gizlendi', `**Kullanıcı:** ${interaction.user} (\`${interaction.user.tag}\`)\n**Kanal:** \`${kanal.name}\` (<#${kanal.id}>)`, RENKLER.UYARI || 0xFEE75C);
            await logGonder(client, interaction.guild.id, logEmb);

          } else if (komut === 'goster') {
            await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true });
            await interaction.reply({ content: '👁️ Kanalınız görünür yapıldı!', ephemeral: true });

            const logEmb = logEmbed('👁️ Geçici Ses Kanalı Görünür Yapıldı', `**Kullanıcı:** ${interaction.user} (\`${interaction.user.tag}\`)\n**Kanal:** \`${kanal.name}\` (<#${kanal.id}>)`, RENKLER.BILGI || 0x5865F2);
            await logGonder(client, interaction.guild.id, logEmb);

          } else if (komut === 'limit') {
            const modal = new ModalBuilder()
              .setCustomId('ses_modal_limit')
              .setTitle('👥 Kanal Kişi Limiti');

            const limitInput = new TextInputBuilder()
              .setCustomId('ses_limit_input')
              .setLabel('Kanal Limiti (0 = Limitsiz, 1-99)')
              .setStyle(TextInputStyle.Short)
              .setMaxLength(2)
              .setRequired(true)
              .setPlaceholder('Örn: 5 (0 = Limitsiz)');

            modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
            return await interaction.showModal(modal);

          } else if (komut === 'ad') {
            const modal = new ModalBuilder()
              .setCustomId('ses_modal_ad')
              .setTitle('✏️ Kanal Adını Değiştir');

            const adInput = new TextInputBuilder()
              .setCustomId('ses_ad_input')
              .setLabel('Yeni Kanal Adı (Maks. 32 karakter)')
              .setStyle(TextInputStyle.Short)
              .setMaxLength(32)
              .setRequired(true)
              .setValue(kanal.name);

            modal.addComponents(new ActionRowBuilder().addComponents(adInput));
            return await interaction.showModal(modal);
          }
        } catch (e) {
          interaction.reply({ content: '❌ Bir hata oluştu: ' + e.message, ephemeral: true }).catch(() => {});
        }
      }

      // ── MÜZİK KONTROL BUTONLARI ──
      else if (customId.startsWith('muzik_')) {
        const sesKanal = interaction.member?.voice?.channel;
        if (!sesKanal) {
          return interaction.reply({
            content: '❌ Müzik butonlarını kullanabilmek için bir ses kanalında olmalısınız!',
            ephemeral: true,
          });
        }

        const botKanal = interaction.guild.members.me?.voice?.channel;
        if (botKanal && botKanal.id !== sesKanal.id) {
          return interaction.reply({
            content: `❌ Bot ile aynı ses kanalında (**${botKanal.name}**) olmalısınız!`,
            ephemeral: true,
          });
        }

        const {
          muzikDuraklat, muzikDevamEt, muzikAtla,
          muzikLoop, muzikDurdur, muzikKaristir,
          kurukuGetir, muzikKontrolButonlari
        } = require('../modules/music/muzikManager');

        const { AudioPlayerStatus } = require('@discordjs/voice');
        const durum = kurukuGetir(interaction.guildId);

        if (!durum || !durum.mevcutParca) {
          return interaction.reply({
            content: '❌ Şu anda çalan aktif bir müzik yok.',
            ephemeral: true,
          });
        }

        const eylem = customId.replace('muzik_', '');

        if (eylem === 'toggle') {
          if (durum.oynatici.state.status === AudioPlayerStatus.Playing) {
            muzikDuraklat(interaction.guildId);
            await interaction.reply({ content: '⏸️ Müzik duraklatıldı.', ephemeral: true });
            interaction.message?.edit({ components: muzikKontrolButonlari(durum.loop, true) }).catch(() => {});
          } else {
            muzikDevamEt(interaction.guildId);
            await interaction.reply({ content: '▶️ Müzik devam ettiriliyor.', ephemeral: true });
            interaction.message?.edit({ components: muzikKontrolButonlari(durum.loop, false) }).catch(() => {});
          }
        } else if (eylem === 'atla') {
          muzikAtla(interaction.guildId, interaction.user);
          await interaction.reply({ content: '⏭️ Parça atlandı!', ephemeral: true });
        } else if (eylem === 'loop') {
          const yeniLoop = muzikLoop(interaction.guildId);
          await interaction.reply({
            content: `🔁 Loop modu **${yeniLoop ? 'AÇILDI' : 'KAPATILDI'}**.`,
            ephemeral: true,
          });
          interaction.message?.edit({ components: muzikKontrolButonlari(yeniLoop, durum.oynatici.state.status === AudioPlayerStatus.Paused) }).catch(() => {});
        } else if (eylem === 'karistir') {
          const sayi = muzikKaristir(interaction.guildId);
          await interaction.reply({
            content: sayi > 1 ? `🔀 Kuyruktaki **${sayi}** parça rastgele karıştırıldı!` : 'ℹ️ Kuyrukta karıştırılacak yeterli parça yok.',
            ephemeral: true,
          });
        } else if (eylem === 'durdur') {
          muzikDurdur(interaction.guildId, interaction.guild);
          await interaction.reply({ content: '⏹️ Müzik durduruldu, kuyruk temizlendi ve kanaldan ayrıldım.', ephemeral: true });
        }
      }
    }
  },
};

