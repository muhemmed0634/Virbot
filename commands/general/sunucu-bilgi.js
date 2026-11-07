// ==========================================
//  VirBot — v!sunucu-bilgi / /sunucu-bilgi Komutu
//  Sunucu istatistikleri (herkes kullanabilir)
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, ChannelType, GuildVerificationLevel } = require('discord.js');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('sunucu-bilgi')
  .setDescription('Sunucu hakkında bilgi ve istatistikleri gösterir.');

const DOGRULAMA = {
  [GuildVerificationLevel.None]: 'Yok',
  [GuildVerificationLevel.Low]: 'Düşük',
  [GuildVerificationLevel.Medium]: 'Orta',
  [GuildVerificationLevel.High]: 'Yüksek',
  [GuildVerificationLevel.VeryHigh]: 'Çok Yüksek',
};

async function bilgiEmbed(guild) {
  const sahip = await guild.fetchOwner().catch(() => null);
  const kanallar = guild.channels.cache;
  const metin = kanallar.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement).size;
  const ses = kanallar.filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).size;
  const kategori = kanallar.filter(c => c.type === ChannelType.GuildCategory).size;
  const botlar = guild.members.cache.filter(m => m.user.bot).size;
  const olusturma = Math.floor(guild.createdTimestamp / 1000);

  return new EmbedBuilder()
    .setTitle(`🏠 ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .setColor(RENKLER.BIRINCIL)
    .addFields(
      { name: '👑 Sahip', value: sahip ? `${sahip.user.tag}` : 'Bilinmiyor', inline: true },
      { name: '🆔 Sunucu ID', value: `\`${guild.id}\``, inline: true },
      { name: '📅 Kuruluş', value: `<t:${olusturma}:D> (<t:${olusturma}:R>)`, inline: true },
      { name: '👥 Üyeler', value: `**${guild.memberCount}** toplam${botlar ? ` • ${botlar} bot (önbellek)` : ''}`, inline: true },
      { name: '💬 Kanallar', value: `${metin} metin • ${ses} ses • ${kategori} kategori`, inline: true },
      { name: '🎭 Roller', value: `${guild.roles.cache.size - 1}`, inline: true },
      { name: '🚀 Boost', value: `Seviye ${guild.premiumTier} • ${guild.premiumSubscriptionCount || 0} boost`, inline: true },
      { name: '😀 Emojiler', value: `${guild.emojis.cache.size}`, inline: true },
      { name: '🛡️ Doğrulama', value: DOGRULAMA[guild.verificationLevel] || 'Bilinmiyor', inline: true },
    )
    .setImage(guild.bannerURL({ size: 1024 }) || null)
    .setFooter({ text: 'VirBot v6' })
    .setTimestamp();
}

module.exports = {
  isim: 'sunucu-bilgi',
  aciklama: 'Sunucu bilgilerini gösterir.',
  alternatifler: ['sunucubilgi', 'serverinfo', 'sunucu'],
  adminGerekli: false,
  herkes: true,
  slashData,

  async calistir(client, mesaj) {
    await mesaj.reply({ embeds: [await bilgiEmbed(mesaj.guild)] });
  },

  async slashCalistir(client, interaction) {
    await interaction.reply({ embeds: [await bilgiEmbed(interaction.guild)] });
  },
};
