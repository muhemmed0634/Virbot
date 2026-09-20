// ==========================================
//  VirBot — voiceStateUpdate Olayı
//  Geçici (Join-to-Create) Ses Kanalları
// ==========================================
'use strict';

const { ayarGetir, tempVoiceKaydet, tempVoiceSil, tempVoiceGetir } = require('../modules/data/dataManager');
const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  isim: 'voiceStateUpdate',

  async calistir(client, oldState, newState) {
    const guild = newState.guild;
    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar?.sesOlusturKanalId) return;

    // Üye kanala katıldı
    if (newState.channelId === ayarlar.sesOlusturKanalId) {
      try {
        const kategoriId = ayarlar.sesKategoriId || newState.channel?.parentId;

        // Geçici kanal oluştur
        const yeniKanal = await guild.channels.create({
          name: `🔊 ${newState.member.user.username}'ın Odası`,
          type: ChannelType.GuildVoice,
          parent: kategoriId,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, allow: ['Connect'] }, // Default açık
            { id: newState.member.id, allow: ['ManageChannels', 'ManageRoles'] }
          ],
        });

        // Üyeyi yeni kanala taşı
        await newState.setChannel(yeniKanal);

        // Ram'e kaydet
        tempVoiceKaydet(yeniKanal.id, newState.member.id);

        // Kontrol paneli gönder
        const butonlar = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ses_kilit').setEmoji('🔒').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ses_ac').setEmoji('🔓').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('ses_gizle').setEmoji('👻').setStyle(ButtonStyle.Secondary)
        );

        const msg = await yeniKanal.send({
          content: `${newState.member}, ses kanalınız oluşturuldu! Aşağıdaki butonları kullanarak kanalınızı yönetebilirsiniz.`,
          components: [butonlar]
        });

        // Mesajı biraz sonra sabitlemek istersen:
        // await msg.pin().catch(()=>{});

      } catch (err) {
        console.error('[SES KANALI] Hata:', err.message);
      }
    }

    // Üye kanaldan ayrıldıysa (Geçici kanal boşaldıysa sil)
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const eskiKanal = oldState.channel;
      if (tempVoiceGetir(eskiKanal.id)) {
        if (eskiKanal.members.size === 0) {
          await eskiKanal.delete().catch(()=>{});
          tempVoiceSil(eskiKanal.id);
        }
      }
    }
  },
};
