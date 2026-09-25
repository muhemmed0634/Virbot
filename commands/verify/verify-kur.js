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
  .addRoleOption(opt =>
    opt
      .setName('alinacak-rol')
      .setDescription('Doğrulama sonrası kullanıcıdan alınacak rol (örn: @NOT VERIFIED)')
      .setRequired(false)
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
  aciklama: 'Doğrulama sistemini kurar. Kullanım: v!verify-kur @doğrulamaRolü [@alinacakRol] [#kanal]',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const roller = Array.from(mesaj.mentions.roles.values());
    const rol = roller[0];
    const alinacakRol = roller[1] || null;

    if (!rol) {
      return mesaj.reply('❌ Bir doğrulama rolü etiketleyin. `v!verify-kur @DoğrulamaRolü [@AlınacakRol] [#kanal]`');
    }

    const kanal = mesaj.mentions.channels.first() || mesaj.channel;

    const embed = new EmbedBuilder()
      .setTitle('✅ Sunucu Doğrulaması')
      .setDescription(
        `**${mesaj.guild.name}** sunucusuna hoş geldiniz!\n\n` +
        `Sunucuya erişmek için aşağıdaki **Doğrula** butonuna tıklayın.\n` +
        `Doğrulama yaparak kuralları kabul etmiş sayılırsınız.\n\n` +
        `🔒 Bu işlem size **${rol.name}** rolünü verecektir.` +
        (alinacakRol ? `\n❌ **${alinacakRol.name}** rolünüz kaldırılacaktır.` : '')
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
      verifyYapilmayanRoluId: alinacakRol?.id || null,
      verifyKanalId  : kanal.id,
      verifyMesajId  : gonderilenMesaj.id,
    });

    await mesaj.reply(`✅ Doğrulama sistemi ${kanal} kanalına kuruldu! Rol: ${rol}${alinacakRol ? ` (Kaldırılacak rol: ${alinacakRol})` : ''}`);

    const logEmb = logEmbed(
      '✅ Doğrulama Sistemi Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}\n**Verilecek Rol:** ${rol.name}` +
      (alinacakRol ? `\n**Alınacak Rol:** ${alinacakRol.name}` : ''),
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
    const alinacakRol = interaction.options.getRole('alinacak-rol');
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
        `🔒 Bu işlem size **${rol.name}** rolünü tanımlayacaktır.` +
        (alinacakRol ? `\n❌ **${alinacakRol.name}** rolünüz kaldırılacaktır.` : '')
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
      verifyYapilmayanRoluId: alinacakRol?.id || null,
      verifyKanalId  : kanal.id,
      verifyMesajId  : gonderilenMesaj.id,
    });

    await interaction.reply({
      content: `✅ Doğrulama paneli ${kanal} kanalına kuruldu! Verilecek Rol: **${rol.name}**${alinacakRol ? ` | Alınacak Rol: **${alinacakRol.name}**` : ''}`,
      ephemeral: true,
    });

    const logEmb = logEmbed(
      '✅ Doğrulama Sistemi Kuruldu (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Kanal:** ${kanal}\n**Verilecek Rol:** ${rol.name}` +
      (alinacakRol ? `\n**Alınacak Rol:** ${alinacakRol.name}` : ''),
      RENKLER.BASARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
