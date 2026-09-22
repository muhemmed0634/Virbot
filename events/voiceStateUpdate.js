// ==========================================
//  VirBot — voiceStateUpdate Olayı
//  Geçici (Join-to-Create) Ses Kanalları
// ==========================================
'use strict';

const { ayarGetir, tempVoiceKaydet, tempVoiceSil, tempVoiceGetir } = require('../modules/data/dataManager');
const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  isim: 'voiceStateUpdate',

  async calistir(client, oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar?.sesOlusturKanalId) return;

    // 1. Üye "➕ Kanal Oluştur" kanalına katıldı
    if (newState.channelId === ayarlar.sesOlusturKanalId && newState.member) {
      try {
        const kategoriId = ayarlar.sesKategoriId || newState.channel?.parentId || null;

        // Kullanıcıya özel geçici oda oluştur
        const kullaniciAdi = newState.member.user.displayName || newState.member.user.username;
        const yeniKanal = await guild.channels.create({
          name: `🔊 ${kullaniciAdi}'ın Odası`,
          type: ChannelType.GuildVoice,
          parent: kategoriId,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
            },
            {
              id: newState.member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.Connect,
              ],
            },
          ],
        });

        // Üyeyi yeni odaya taşı
        await newState.setChannel(yeniKanal);

        // Önbelleğe kaydet
        tempVoiceKaydet(yeniKanal.id, newState.member.id);

        // Kontrol butonları
        const butonlar = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ses_kilit').setEmoji('🔒').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ses_ac').setEmoji('🔓').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('ses_gizle').setEmoji('👻').setStyle(ButtonStyle.Secondary)
        );

        await yeniKanal.send({
          content: `${newState.member}, ses kanalınız oluşturuldu! Aşağıdaki butonları kullanarak kanalınızı kilitleyebilir veya gizleyebilirsiniz.`,
          components: [butonlar],
        }).catch(() => {});

      } catch (err) {
        console.error('[SES KANALI] Geçici kanal oluşturma hatası:', err.message);
      }
    }

    // 2. Üye kanaldan ayrıldıysa (Geçici kanal boşaldıysa sil)
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const eskiKanal = oldState.channel;
      if (eskiKanal && tempVoiceGetir(eskiKanal.id)) {
        if (eskiKanal.members.size === 0) {
          await eskiKanal.delete().catch(() => {});
          tempVoiceSil(eskiKanal.id);
        }
      }
    }
  },
};
