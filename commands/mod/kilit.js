// ==========================================
//  VirBot — v!kilit / /kilit Komutu
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
  .setName('kilit')
  .setDescription('Kanalı üyelerin mesaj yazmasına kilitler.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Kilitlenecek metin kanalı (boş bırakılırsa mevcut kanal)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'kilit',
  aciklama: 'Kanalı üyelerin mesaj göndermesine kilitler.',
  alternatifler: ['lock', 'kilitle'],
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (!mesaj.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return mesaj.reply('❌ Bu komutu kullanmak için `Kanalları Yönet` yetkisine sahip olmalısınız.');
    }

    const hedefKanal = mesaj.mentions.channels.first() || mesaj.channel;

    await hedefKanal.permissionOverwrites.edit(mesaj.guild.roles.everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(RENKLER.HATA)
      .setTitle('🔒 Kanal Kilitlendi')
      .setDescription(`Bu kanal <@${mesaj.author.id}> tarafından mesaj gönderimine kapatıldı.`)
      .setTimestamp();

    await hedefKanal.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔒 Kanal Kilitlendi',
      `**Kanal:** <#${hedefKanal.id}>\n**Yetkili:** ${mesaj.author.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const hedefKanal = interaction.options.getChannel('kanal') || interaction.channel;

    await hedefKanal.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(RENKLER.HATA)
      .setTitle('🔒 Kanal Kilitlendi')
      .setDescription(`Bu kanal <@${interaction.user.id}> tarafından mesaj gönderimine kapatıldı.`)
      .setTimestamp();

    await interaction.reply({ content: `✅ <#${hedefKanal.id}> kanalı başarıyla kilitlendi.`, ephemeral: true });
    await hedefKanal.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔒 Kanal Kilitlendi (Slash)',
      `**Kanal:** <#${hedefKanal.id}>\n**Yetkili:** ${interaction.user.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
