// ==========================================
//  VirBot — v!kilit-ac / /kilit-ac Komutu
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
  .setName('kilit-ac')
  .setDescription('Kilitli kanalın mesaj yazma kilidini açar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Kilidi açılacak metin kanalı (boş bırakılırsa mevcut kanal)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'kilit-ac',
  aciklama: 'Kilitli kanalın mesaj gönderme kilidini açar.',
  alternatifler: ['unlock', 'kilitac'],
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (!mesaj.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return mesaj.reply('❌ Bu komutu kullanmak için `Kanalları Yönet` yetkisine sahip olmalısınız.');
    }

    const hedefKanal = mesaj.mentions.channels.first() || mesaj.channel;

    await hedefKanal.permissionOverwrites.edit(mesaj.guild.roles.everyone, {
      SendMessages: null,
    });

    const embed = new EmbedBuilder()
      .setColor(RENKLER.BASARILI)
      .setTitle('🔓 Kanal Kilidi Açıldı')
      .setDescription(`Bu kanal <@${mesaj.author.id}> tarafından mesaj gönderimine yeniden açıldı.`)
      .setTimestamp();

    await hedefKanal.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔓 Kanal Kilidi Açıldı',
      `**Kanal:** <#${hedefKanal.id}>\n**Yetkili:** ${mesaj.author.tag}`,
      RENKLER.BASARILI,
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
      SendMessages: null,
    });

    const embed = new EmbedBuilder()
      .setColor(RENKLER.BASARILI)
      .setTitle('🔓 Kanal Kilidi Açıldı')
      .setDescription(`Bu kanal <@${interaction.user.id}> tarafından mesaj gönderimine yeniden açıldı.`)
      .setTimestamp();

    await interaction.reply({ content: `✅ <#${hedefKanal.id}> kanalının kilidi başarıyla açıldı.`, ephemeral: true });
    await hedefKanal.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔓 Kanal Kilidi Açıldı (Slash)',
      `**Kanal:** <#${hedefKanal.id}>\n**Yetkili:** ${interaction.user.tag}`,
      RENKLER.BASARILI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
