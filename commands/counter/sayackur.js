// ==========================================
//  VirBot — v!sayackur Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'sayackur',
  aciklama: 'Üye sayacı kanalını kurar. Kullanım: v!sayackur [hedef] #kanal',
  adminGerekli: true,

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
};
