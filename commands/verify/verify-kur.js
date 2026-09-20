// ==========================================
//  VirBot — v!verify-kur Komutu
//  Doğrulama butonu kurulumu
// ==========================================
'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'verify-kur',
  aciklama: 'Doğrulama sistemini kurar. Kullanım: v!verify-kur @doğrulamaRolü [#kanal]',
  adminGerekli: true,

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

    // Ayarları kaydet
    await guildGuncelle(mesaj.guild.id, {
      verifyRolId    : rol.id,
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
};
