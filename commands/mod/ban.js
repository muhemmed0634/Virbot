// ==========================================
//  VirBot — v!ban Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'ban',
  aciklama: 'Bir kullanıcıyı sunucudan yasaklar.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin. `v!ban @kullanıcı [sebep]`');

    if (!hedef.bannable) return mesaj.reply('❌ Bu kullanıcıyı yasaklayamıyorum (yetkim yok veya üst roldedir).');

    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    await hedef.ban({ reason: `${mesaj.author.tag}: ${sebep}` });

    const embed = new EmbedBuilder()
      .setTitle('🔨 Kullanıcı Yasaklandı')
      .addFields(
        { name: 'Kullanıcı', value: `${hedef.user.tag} (<@${hedef.id}>)`, inline: true },
        { name: 'Yetkili', value: mesaj.author.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.HATA)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔨 Ban — Kullanıcı Yasaklandı',
      `**Kullanıcı:** ${hedef.user.tag}\n**Yetkili:** ${mesaj.author.tag}\n**Sebep:** ${sebep}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
