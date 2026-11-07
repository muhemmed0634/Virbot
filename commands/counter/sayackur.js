// ==========================================
//  VirBot — v!sayackur Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('sayackur')
  .setDescription('Üye sayacı kanalını kurar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addIntegerOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Ulaşılmak istenen üye hedef sayısı (örn: 100)')
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Sayaç bildirimlerinin gönderileceği kanal')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'sayackur',
  aciklama: 'Üye sayacı kanalını kurar. Kullanım: v!sayackur [hedef] #kanal',
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    const hedef = parseInt(args[0]) || 100;
    const kanal = mesaj.mentions.channels.first() || mesaj.channel;

    await guildGuncelle(mesaj.guild.id, { sayacKanalId: kanal.id, sayacHedef: hedef });

    const embed = new EmbedBuilder()
      .setTitle('📊 Sayaç Kuruldu')
      .setDescription(`Sayaç kanalı: ${kanal}\nHedef: **${hedef}** üye\n\nYeni üyeler katıldıkça kanal mesajla bilgilendirilecek.`)
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
    await kanal.send(`📊 Sayaç sistemi aktif! Mevcut üye: **${mesaj.guild.memberCount}** / Hedef: **${hedef}**`);

    const logEmb = logEmbed(
      '📊 Sayaç Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}\n**Hedef:** ${hedef}`,
      RENKLER.BILGI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const hedef = interaction.options.getInteger('hedef') || 100;
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    await guildGuncelle(interaction.guild.id, { sayacKanalId: kanal.id, sayacHedef: hedef });

    const embed = new EmbedBuilder()
      .setTitle('📊 Sayaç Kuruldu')
      .setDescription(`Sayaç kanalı: ${kanal}\nHedef: **${hedef}** üye\n\nYeni üyeler katıldıkça kanal bilgilendirilecek.`)
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await kanal.send(`📊 Sayaç sistemi aktif! Mevcut üye: **${interaction.guild.memberCount}** / Hedef: **${hedef}**`).catch(() => {});

    const logEmb = logEmbed(
      '📊 Sayaç Kuruldu (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Kanal:** ${kanal}\n**Hedef:** ${hedef}`,
      RENKLER.BILGI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
