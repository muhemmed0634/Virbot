// ==========================================
//  VirBot — v!ticket-kur Komutu
// ==========================================
'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'ticket-kur',
  aciklama: 'Bulunulan kanala ticket açma mesajı gönderir.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
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

    await mesaj.channel.send({ embeds: [embed], components: [butonlar] });
    await mesaj.delete().catch(() => {});

    const logEmb = logEmbed(
      '🎫 Ticket Sistemi Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${mesaj.channel}`,
      RENKLER.TICKET,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
