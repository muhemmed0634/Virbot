// ==========================================
//  VirBot v6 — /jail-at / v!jail-at Komutu
//  Kullanıcıyı CEZALI rolüne atar, tüm rolleri alır
// ==========================================
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { jailAt } = require('../../modules/security/jailManager');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('jail-at')
  .setDescription('Kullanıcıyı hapise atar, tüm rolleri alınır.')
  .addUserOption(opt =>
    opt.setName('kullanici').setDescription('Hapsedilecek kullanıcı').setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('sebep').setDescription('Sebep').setRequired(false)
  );

module.exports = {
  isim: 'jail-at',
  aciklama: 'Kullanıcıyı hapise atar.',
  alternatifler: [],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const hedefUye = mesaj.mentions.members?.first();
    if (!hedefUye) return mesaj.reply('❌ Kullanıcı belirt! `v!jail-at @kullanici [sebep]`');
    if (hedefUye.id === mesaj.author.id) return mesaj.reply('❌ Kendinizi hapse atamazsınız.');

    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    const sonuc = await jailAt(hedefUye, mesaj.member, mesaj.guild, sebep, client);

    if (sonuc.hata) return mesaj.reply(`❌ ${sonuc.hata}`);

    const embed = new EmbedBuilder()
      .setTitle('🔒 Kullanıcı Hapsedildi')
      .setDescription(
        `**Kullanıcı:** ${hedefUye}\n` +
        `**Sebep:** ${sebep}\n` +
        `**Moderatör:** ${mesaj.author}\n` +
        `**Kaldırılan Rol Sayısı:** ${sonuc.eskiRolSayisi}`
      )
      .setColor(RENKLER.HATA)
      .setTimestamp()
      .setFooter({ text: 'VirBot v6' });

    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const hedefUye = interaction.options.getMember('kullanici');
    if (!hedefUye) return interaction.reply({ content: '❌ Geçersiz kullanıcı.', ephemeral: true });
    if (hedefUye.id === interaction.user.id) return interaction.reply({ content: '❌ Kendinizi hapse atamazsınız.', ephemeral: true });

    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    await interaction.deferReply({ ephemeral: false });

    const sonuc = await jailAt(hedefUye, interaction.member, interaction.guild, sebep, client);
    if (sonuc.hata) return interaction.editReply(`❌ ${sonuc.hata}`);

    const embed = new EmbedBuilder()
      .setTitle('🔒 Kullanıcı Hapsedildi')
      .setDescription(
        `**Kullanıcı:** ${hedefUye}\n` +
        `**Sebep:** ${sebep}\n` +
        `**Moderatör:** ${interaction.user}\n` +
        `**Kaldırılan Rol Sayısı:** ${sonuc.eskiRolSayisi}`
      )
      .setColor(RENKLER.HATA)
      .setTimestamp()
      .setFooter({ text: 'VirBot v6' });

    await interaction.editReply({ embeds: [embed] });
  },
};
