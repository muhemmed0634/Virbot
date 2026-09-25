// ==========================================
//  VirBot — v!kullanici-id / /kullanici-id Komutu
//  Kullanıcının veya etiketlenen üyenin Discord ID'sini verir
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('kullanici-id')
  .setDescription('Belirtilen üyenin veya sizin Discord ID\'nizi gösterir.')
  .addUserOption(opt =>
    opt
      .setName('uye')
      .setDescription('ID\'sini görmek istediğiniz üye (boş bırakılırsa kendiniz)')
      .setRequired(false)
  );

module.exports = {
  isim: 'kullanici-id',
  alternatifler: ['uid', 'kullaniciid', 'userid', 'kulid', 'kid'],
  aciklama: 'Belirtilen kullanıcının Discord ID\'sini gösterir.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  // ─── Prefix Komutu (v!kullanici-id [@üye]) ─────────────────
  async calistir(client, mesaj, args) {
    // Önce mention, sonra yanıtlanan mesajın sahibi, sonra kendi ID
    const mentionUye = mesaj.mentions.members?.first();
    let hedef = mentionUye || mesaj.member;

    if (!mentionUye && mesaj.reference) {
      try {
        const yanıtlananMesaj = await mesaj.channel.messages.fetch(mesaj.reference.messageId);
        hedef = yanıtlananMesaj.member || {
          id: yanıtlananMesaj.author.id,
          user: yanıtlananMesaj.author,
          displayName: yanıtlananMesaj.author.username,
        };
      } catch (_) {}
    }

    const user = hedef?.user || hedef;
    const displayName = hedef?.displayName || user?.username || 'Bilinmiyor';
    const avatarUrl = user?.displayAvatarURL?.({ size: 128 }) || null;

    const embed = new EmbedBuilder()
      .setTitle(`🆔 Kullanıcı Bilgisi — ${displayName}`)
      .addFields(
        { name: '🪪 Kullanıcı ID', value: `\`${user?.id || hedef?.id}\``, inline: false },
        { name: '👤 Kullanıcı Adı', value: user?.username || displayName, inline: true },
        { name: '🏷️ Global İsim', value: user?.globalName || user?.username || '-', inline: true },
        { name: '📅 Hesap Oluşturulma', value: user?.createdAt ? `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>` : '-', inline: false },
      )
      .setColor(RENKLER.BIRINCIL)
      .setFooter({ text: 'ID\'yi kopyalamak için kod bloğuna tıklayın.' })
      .setTimestamp();

    if (avatarUrl) embed.setThumbnail(avatarUrl);

    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu (/kullanici-id) ──────────────────────────
  async slashCalistir(client, interaction) {
    const hedefUser = interaction.options.getUser('uye') || interaction.user;
    const hedefMember = interaction.options.getMember('uye') || interaction.member;
    const displayName = hedefMember?.displayName || hedefUser.username;
    const avatarUrl = hedefUser.displayAvatarURL({ size: 128 });

    const embed = new EmbedBuilder()
      .setTitle(`🆔 Kullanıcı Bilgisi — ${displayName}`)
      .addFields(
        { name: '🪪 Kullanıcı ID', value: `\`${hedefUser.id}\``, inline: false },
        { name: '👤 Kullanıcı Adı', value: hedefUser.username, inline: true },
        { name: '🏷️ Global İsim', value: hedefUser.globalName || hedefUser.username, inline: true },
        { name: '📅 Hesap Oluşturulma', value: `<t:${Math.floor(hedefUser.createdAt.getTime() / 1000)}:R>`, inline: false },
      )
      .setColor(RENKLER.BIRINCIL)
      .setThumbnail(avatarUrl)
      .setFooter({ text: 'ID\'yi kopyalamak için kod bloğuna tıklayın.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
