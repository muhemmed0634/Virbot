// ==========================================
//  VirBot — v!verify-kur / /verify-kur Komutu
//  Doğrulama butonu kurulumu
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
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('verify-kur')
  .setDescription('Butonlu üye doğrulama (verify) panelini kurar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption(opt =>
    opt
      .setName('rol')
      .setDescription('Doğrulama yapan üyeye verilecek rol')
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Doğrulama butonunun gönderileceği kanal (boş bırakılırsa mevcut kanal)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'verify-kur',
  aciklama: 'Doğrulama sistemini kurar. Kullanım: v!verify-kur @doğrulamaRolü [#kanal]',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const rol = mesaj.mentions.roles.first();
    if (!rol) {
      return mesaj.reply('❌ Bir doğrulama rolü etiketleyin. `v!verify-kur @ÜyeRolü [#kanal]`');
    }

    const kanal = mesaj.mentions.channels.first() || mesaj.channel;

    const embed = new EmbedBuilder()
      .setTitle('✅ Sunucu Doğrulaması')
      .setDescription(
        `**${mesaj.guild.name}** sunucusuna hoş geldiniz!\n\n` +
        `Sunucuya erişmek için aşağıdaki **Doğrula** butonuna tıklayın.\n` +
        `Doğrulama yaparak kuralları kabul etmiş sayılırsınız.\n\n` +
        `🔒 Bu işlem size **${rol.name}** rolünü verecektir.`
      )
      .setColor(RENKLER.BASARI)
      .setThumbnail(mesaj.guild.iconURL({ size: 256 }))
      .setFooter({ text: 'VirBot Doğrulama Sistemi' })
      .setTimestamp();

    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_${rol.id}`)
        .setLabel('✅ Doğrula')
        .setStyle(ButtonStyle.Success),
    );

    const gonderilenMesaj = await kanal.send({ embeds: [embed], components: [butonlar] });

    await guildGuncelle(mesaj.guild.id, {
      verifyRoluId   : rol.id,
      verifyKanalId  : kanal.id,
      verifyMesajId  : gonderilenMesaj.id,
    });

    await mesaj.reply(`✅ Doğrulama sistemi ${kanal} kanalına kuruldu! Doğrulama rolü: ${rol}`);

    const logEmb = logEmbed(
      '✅ Doğrulama Sistemi Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}\n**Rol:** ${rol.name}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const rol = interaction.options.getRole('rol');
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    if (!kanal || kanal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Lütfen geçerli bir metin kanalı seçin!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Sunucu Doğrulaması')
      .setDescription(
        `**${interaction.guild.name}** sunucusuna hoş geldiniz!\n\n` +
        `Sunucuya tam erişim sağlamak için aşağıdaki **Doğrula** butonuna tıklayın.\n` +
        `Doğrulama yaparak sunucu kurallarını kabul etmiş sayılırsınız.\n\n` +
        `🔒 Bu işlem size **${rol.name}** rolünü tanımlayacaktır.`
      )
      .setColor(RENKLER.BASARI)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setFooter({ text: 'VirBot Doğrulama Sistemi' })
      .setTimestamp();

    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_${rol.id}`)
        .setLabel('✅ Doğrula')
        .setStyle(ButtonStyle.Success),
    );

    const gonderilenMesaj = await kanal.send({ embeds: [embed], components: [butonlar] });

    await guildGuncelle(interaction.guild.id, {
      verifyRoluId   : rol.id,
      verifyKanalId  : kanal.id,
      verifyMesajId  : gonderilenMesaj.id,
    });

    await interaction.reply({
      content: `✅ Doğrulama paneli ${kanal} kanalına kuruldu! Rol: **${rol.name}**`,
      ephemeral: true,
    });

    const logEmb = logEmbed(
      '✅ Doğrulama Sistemi Kuruldu (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Kanal:** ${kanal}\n**Rol:** ${rol.name}`,
      RENKLER.BASARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
