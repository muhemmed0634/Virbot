// ==========================================
//  VirBot — v!battle Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { battle } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'battle',
  aciklama: 'Başka bir kullanıcıyla düello yaparsın.',
  alternatifler: ['savas', 'düello'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    
    if (!hedef) {
      return mesaj.reply('❌ Kime saldırmak istediğini etiketle: `v!battle @kullanıcı`');
    }
    if (hedef.user.bot) return mesaj.reply('❌ Botlarla savaşamazsın.');
    if (hedef.id === mesaj.author.id) return mesaj.reply('❌ Kendine saldıramazsın.');

    const sonuc = await battle(mesaj.author.id, hedef.id, mesaj.guild.id);
    
    const kazananUye = sonuc.kazanan === mesaj.author.id ? mesaj.author : hedef.user;
    const kaybedenUye = sonuc.kaybeden === mesaj.author.id ? mesaj.author : hedef.user;

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Düello Sonucu!')
      .setDescription(`**${mesaj.author.username}** (Güç: ${sonuc.saldirganGuc}) 🆚 **${hedef.user.username}** (Güç: ${sonuc.hedefGuc})`)
      .addFields(
        { name: '🏆 Kazanan', value: `<@${sonuc.kazanan}>`, inline: true },
        { name: '💀 Kaybeden', value: `<@${sonuc.kaybeden}>`, inline: true },
        { name: '💰 Ödül', value: `Kazanan **${sonuc.odul} Coin** ganimet elde etti!` }
      )
      .setColor(RENKLER.RPG)
      .setThumbnail(kazananUye.displayAvatarURL());

    await mesaj.reply({ embeds: [embed] });
  },
};
