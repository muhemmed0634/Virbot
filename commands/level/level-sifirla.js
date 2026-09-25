// ==========================================
//  VirBot — v!level-sifirla Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('level-sifirla')
  .setDescription('Belirtilen kullanıcının seviye verilerini sıfırlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addUserOption(opt =>
    opt
      .setName('kullanici')
      .setDescription('Seviyesi sıfırlanacak kullanıcı')
      .setRequired(true)
  );

module.exports = {
  isim: 'level-sifirla',
  aciklama: 'Belirtilen kullanıcının seviye verilerini sıfırlar.',
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    
    if (!hedef) {
      return mesaj.reply('❌ Lütfen bir kullanıcı etiketleyin. `v!level-sifirla @kullanıcı`');
    }

    await kullaniciGuncelle(hedef.id, mesaj.guild.id, {
      xp: 0,
      level: 0,
    });

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Seviye Sıfırlandı')
      .setDescription(`${hedef} kullanıcısının XP ve seviyesi sıfırlandı.`)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🗑️ Seviye Sıfırlandı',
      `**Yetkili:** ${mesaj.author.tag}\n**Kullanıcı:** ${hedef.user.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const hedefUser = interaction.options.getUser('kullanici');
    const hedefMember = interaction.options.getMember('kullanici');

    await kullaniciGuncelle(hedefUser.id, interaction.guild.id, {
      xp: 0,
      level: 0,
    });

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Seviye Sıfırlandı')
      .setDescription(`${hedefMember || hedefUser} kullanıcısının XP ve seviyesi sıfırlandı.`)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🗑️ Seviye Sıfırlandı (Slash)',
      `**Yetkili:** ${interaction.user.tag}\n**Kullanıcı:** ${hedefUser.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
