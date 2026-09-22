// ==========================================
//  VirBot — v!yavas-mod / /yavas-mod Komutu
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('yavas-mod')
  .setDescription('Mevcut kanala yavaş mod (slowmode) süresi ayarlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addIntegerOption(opt =>
    opt
      .setName('saniye')
      .setDescription('Yavaş mod bekleme süresi saniye cinsinden (0 kapatır, maksimum 21600)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(21600)
  );

module.exports = {
  isim: 'yavas-mod',
  aciklama: 'Kanalda mesaj yazma aralığını (yavaş modu) ayarlar.',
  alternatifler: ['slowmode', 'yavasmod'],
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (!mesaj.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return mesaj.reply('❌ Bu komutu kullanmak için `Kanalları Yönet` yetkisine sahip olmalısınız.');
    }

    const saniye = parseInt(args[0], 10);
    if (isNaN(saniye) || saniye < 0 || saniye > 21600) {
      return mesaj.reply('❌ Lütfen 0 ile 21600 arasında bir saniye belirtin: `v!yavas-mod 5` (0 kapatır)');
    }

    await mesaj.channel.setRateLimitPerUser(saniye);

    const embed = new EmbedBuilder()
      .setColor(RENKLER.BASARILI)
      .setTitle('⏱️ Yavaş Mod Ayarlandı')
      .setDescription(
        saniye === 0
          ? '✅ Kanalda yavaş mod kapatıldı!'
          : `✅ Bu kanalda üyeler her **${saniye} saniyede** bir mesaj yazabilir.`
      )
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '⏱️ Yavaş Mod Değiştirildi',
      `**Kanal:** <#${mesaj.channel.id}>\n**Yetkili:** ${mesaj.author.tag}\n**Süre:** ${saniye} saniye`,
      RENKLER.BILGI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const saniye = interaction.options.getInteger('saniye');
    await interaction.channel.setRateLimitPerUser(saniye);

    const embed = new EmbedBuilder()
      .setColor(RENKLER.BASARILI)
      .setTitle('⏱️ Yavaş Mod Ayarlandı')
      .setDescription(
        saniye === 0
          ? '✅ Kanalda yavaş mod kapatıldı!'
          : `✅ Bu kanalda üyeler her **${saniye} saniyede** bir mesaj yazabilir.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '⏱️ Yavaş Mod Değiştirildi (Slash)',
      `**Kanal:** <#${interaction.channel.id}>\n**Yetkili:** ${interaction.user.tag}\n**Süre:** ${saniye} saniye`,
      RENKLER.BILGI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
