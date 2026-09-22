// ==========================================
//  VirBot — v!ticket-kur / /ticket-kur Komutu
// ==========================================
'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('ticket-kur')
  .setDescription('Destek talebi (ticket) açma panelini gönderir.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Ticket panelinin gönderileceği metin kanalı (boş bırakılırsa mevcut kanal)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'ticket-kur',
  aciklama: 'Bulunulan veya belirtilen kanala ticket açma mesajı gönderir.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first() || mesaj.channel;

    const embed = new EmbedBuilder()
      .setTitle('🎫 Destek Sistemi')
      .setDescription(
        `**VirBot Destek Birimi**'ne hoş geldiniz.\n\n` +
        `Bir sorununuz varsa, şikayet bildirmek istiyorsanız veya yardıma ihtiyacınız varsa ` +
        `aşağıdaki **Destek Talebi Aç** butonuna tıklayarak ekibimizle iletişime geçebilirsiniz.\n\n` +
        `⚠️ Gereksiz yere destek talebi açmak yasaktır.`
      )
      .setColor(RENKLER.TICKET)
      .setThumbnail(mesaj.guild.iconURL({ size: 256 }))
      .setFooter({ text: 'VirBot Ticket Sistemi' });

    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_ac')
        .setLabel('🎫 Destek Talebi Aç')
        .setStyle(ButtonStyle.Primary),
    );

    await kanal.send({ embeds: [embed], components: [butonlar] });
    await mesaj.delete().catch(() => {});

    const logEmb = logEmbed(
      '🎫 Ticket Sistemi Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}`,
      RENKLER.TICKET,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    if (!kanal || kanal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Lütfen geçerli bir metin kanalı seçin!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Destek Sistemi')
      .setDescription(
        `**VirBot Destek Birimi**'ne hoş geldiniz.\n\n` +
        `Bir sorununuz varsa, şikayet bildirmek istiyorsanız veya yardıma ihtiyacınız varsa ` +
        `aşağıdaki **Destek Talebi Aç** butonuna tıklayarak ekibimizle iletişime geçebilirsiniz.\n\n` +
        `⚠️ Gereksiz yere destek talebi açmak yasaktır.`
      )
      .setColor(RENKLER.TICKET)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setFooter({ text: 'VirBot Ticket Sistemi' });

    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_ac')
        .setLabel('🎫 Destek Talebi Aç')
        .setStyle(ButtonStyle.Primary),
    );

    await kanal.send({ embeds: [embed], components: [butonlar] });
    await interaction.reply({ content: `✅ Ticket paneli başarıyla ${kanal} kanalına gönderildi!`, ephemeral: true });

    const logEmb = logEmbed(
      '🎫 Ticket Sistemi Kuruldu (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Kanal:** ${kanal}`,
      RENKLER.TICKET,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
