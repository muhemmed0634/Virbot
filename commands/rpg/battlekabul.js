// ==========================================
//  VirBot v6 — v!battlekabul Komutu
//  (Battle sisteminin kabul kısayolu)
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { meydanKabul } = require('../../modules/rpg/battleManager');

// Sonuç embed'i battle.js'den tekrar require etmek yerine burada inline tutuyoruz
function ekipmanSatiri(kullanici, isim) {
  const silah = kullanici.silah ? `${kullanici.silah.isim} (+${kullanici.silah.guc})` : '_(yok)_';
  const zirh  = kullanici.zirh  ? `${kullanici.zirh.isim} (+${kullanici.zirh.guc})`  : '_(yok)_';
  return `**${isim}** — ⚔️ ${silah} | 🛡️ ${zirh}`;
}

function raundMetni(r, isim1, isim2) {
  const k1 = r.kritik1 ? ' ⚡KRİTİK!' : '';
  const k2 = r.kritik2 ? ' ⚡KRİTİK!' : '';
  return (
    `**Raund ${r.raund}**\n` +
    `🗡️ ${isim1}: **${r.hasar1}** hasar${k1} → ${isim2} HP: **${r.hp2}**\n` +
    `🗡️ ${isim2}: **${r.hasar2}** hasar${k2} → ${isim1} HP: **${r.hp1}**`
  );
}

function sonucEmbed(sonuc, challUsername, hedefUsername, challAvatarURL) {
  const kazananIsim = sonuc.kazananId === sonuc.challUser.userId ? challUsername : hedefUsername;
  const kazananAvatar = sonuc.kazananId === sonuc.challUser.userId ? challAvatarURL : null;

  const raundOzeti = sonuc.raunlar
    .slice(-3)
    .map(r => raundMetni(r, challUsername, hedefUsername))
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Battle Sonucu!')
    .setColor(RENKLER.RPG)
    .setDescription(
      `### 🏆 ${kazananIsim} kazandı!\n\n` +
      `${ekipmanSatiri(sonuc.challUser, challUsername)}\n` +
      `${ekipmanSatiri(sonuc.hedefUser, hedefUsername)}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📜 **Son Raunlar:**\n${raundOzeti}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `❤️ Kazanan HP: **${sonuc.kazananHP}**\n` +
      `💀 Kaybeden HP: **${sonuc.kaybedenHP}**\n\n` +
      `🪙 **Pot:** ${sonuc.pot} coin\n` +
      `🏆 **Kazanan Bakiye:** ${sonuc.kazananYeniBakiye} 🪙`
    )
    .setFooter({ text: 'VirBot RPG • /market ile ekipman al, savaşlarda üstün gel!' })
    .setTimestamp();

  if (kazananAvatar) embed.setThumbnail(kazananAvatar);
  return embed;
}

module.exports = {
  isim: 'battlekabul',
  aciklama: 'Gelen battle meydan okumasını kabul edersin.',
  alternatifler: ['bkabul', 'savaşkabul'],
  adminGerekli: false,
  rpgKomutu: true,

  async calistir(client, mesaj, args) {
    const challUye = mesaj.mentions.members.first();
    if (!challUye) {
      return mesaj.reply(
        '❌ Kullanım: `v!battlekabul @meydan_okuyan`\n' +
        'Örnek: `v!battlekabul @Ahmet`'
      );
    }

    const sonuc = await meydanKabul(challUye.id, mesaj.author.id, mesaj.guild.id);
    if (sonuc.hata) return mesaj.reply(sonuc.hata);

    const challUser = challUye.user;
    await mesaj.reply({
      embeds: [
        sonucEmbed(
          sonuc.sonuc,
          challUser.username,
          mesaj.author.username,
          challUser.displayAvatarURL({ size: 64 })
        ),
      ],
    });
  },
};
