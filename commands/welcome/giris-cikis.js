// ==========================================
//  VirBot — /giris-cikis Slash Komut Desteği
// ==========================================
'use strict';

const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const girisKomutu = require('./giris');

const slashData = new SlashCommandBuilder()
  .setName('giris-cikis')
  .setDescription('Giriş ve çıkış (resimli karşılama & veda) kanalını ayarlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Giriş ve çıkış kartlarının gönderileceği metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'giris-cikis',
  aciklama: 'Giriş ve çıkış (resimli karşılama & veda) kanalını ayarlar.',
  kullanim: 'v!giris-cikis #kanal',
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    return girisKomutu.calistir(client, mesaj, args);
  },

  async slashCalistir(client, interaction) {
    return girisKomutu.slashCalistir(client, interaction);
  },
};
