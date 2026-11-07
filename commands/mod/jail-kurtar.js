// ==========================================
//  VirBot v6 — /jail-kurtar / v!jail-kurtar Komutu
//  Kullanıcıyı hapisten çıkarır, rollerini iade eder
// ==========================================
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { jailKurtar } = require('../../modules/security/jailManager');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('jail-kurtar')
  .setDescription('Kullanıcıyı hapisten çıkarır, eski rollerini iade eder.')
  .addUserOption(opt =>
    opt.setName('kullanici').setDescription('Serbest bırakılacak kullanıcı').setRequired(true)
  );

module.exports = {
  isim: 'jail-kurtar',
  aciklama: 'Kullanıcıyı hapisten çıkarır.',
  alternatifler: [],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const hedefUye = mesaj.mentions.members?.first();
    if (!hedefUye) return mesaj.reply('❌ Kullanıcı belirt! `v!jail-kurtar @kullanici`');

    const sonuc = await jailKurtar(hedefUye, mesaj.member, mesaj.guild, client);
    if (sonuc.hata) return mesaj.reply(`❌ ${sonuc.hata}`);

    const embed = new EmbedBuilder()
      .setTitle('🔓 Kullanıcı Serbest Bırakıldı')
      .setDescription(
        `**Kullanıcı:** ${hedefUye}\n` +
        `**Moderatör:** ${mesaj.author}\n` +
        `**İade Edilen Rol Sayısı:** ${sonuc.iadeSayisi}`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp()
      .setFooter({ text: 'VirBot v6' });

    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const hedefUye = interaction.options.getMember('kullanici');
    if (!hedefUye) return interaction.reply({ content: '❌ Geçersiz kullanıcı.', ephemeral: true });

    await interaction.deferReply({ ephemeral: false });
    const sonuc = await jailKurtar(hedefUye, interaction.member, interaction.guild, client);
    if (sonuc.hata) return interaction.editReply(`❌ ${sonuc.hata}`);

    const embed = new EmbedBuilder()
      .setTitle('🔓 Kullanıcı Serbest Bırakıldı')
      .setDescription(
        `**Kullanıcı:** ${hedefUye}\n` +
        `**Moderatör:** ${interaction.user}\n` +
        `**İade Edilen Rol Sayısı:** ${sonuc.iadeSayisi}`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp()
      .setFooter({ text: 'VirBot v6' });

    await interaction.editReply({ embeds: [embed] });
  },
};
