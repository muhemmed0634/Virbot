// ==========================================
//  VirBot — interactionCreate Olayı (v2)
//  Slash Komutları, Butonlar (Ticket, Çekiliş, Ses)
// ==========================================
'use strict';

const { ticketAc, ticketKapat } = require('../modules/ticket/ticketManager');
const { cekiliseKatil, cekilisiBitir } = require('../modules/giveaway/giveawayManager');
const { yetkiliMi, yetkiRed } = require('../modules/permissions/permCheck');

module.exports = {
  isim: 'interactionCreate',

  async calistir(client, interaction) {
    // ── 1. SLASH KOMUTLARI (ChatInputCommand) ──
    if (interaction.isChatInputCommand()) {
      const komut = client.komutlar.get(interaction.commandName);
      if (!komut) return;

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

    // ── 2. BUTONLAR (ButtonInteraction) ──
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

        await interaction.member.roles.add(rol).catch(console.error);
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

        const { tempVoiceGetir } = require('../modules/data/dataManager');
        const sahipId = tempVoiceGetir(kanal.id);

        if (sahipId !== interaction.user.id && !yetkiliMi(interaction.member)) {
          return interaction.reply({
            content: '❌ Bu kanalın sahibi siz değilsiniz!',
            ephemeral: true,
          });
        }

        try {
          if (komut === 'kilit') {
            await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
            await interaction.reply({ content: '🔒 Kanalınız kilitlendi!', ephemeral: true });
          } else if (komut === 'ac') {
            await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: true });
            await interaction.reply({ content: '🔓 Kanal kilidi açıldı!', ephemeral: true });
          } else if (komut === 'gizle') {
            await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
            await interaction.reply({ content: '👻 Kanalınız gizlendi!', ephemeral: true });
          }
        } catch (e) {
          interaction.reply({ content: '❌ Bir hata oluştu: ' + e.message, ephemeral: true }).catch(() => {});
        }
      }
    }
  },
};
