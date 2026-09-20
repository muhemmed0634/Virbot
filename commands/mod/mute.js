// ==========================================
//  VirBot — v!mute Komutu (Timeout)
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

// Süre çözümleyici: "10m", "1h", "1d" vb.
function sureCoz(metin) {
  const eslesmeler = metin.match(/(\d+)(s|m|h|d)/gi);
  if (!eslesmeler) return null;
  let ms = 0;
  for (const e of eslesmeler) {
    const sayi = parseInt(e);
    const birim = e.slice(-1).toLowerCase();
    if (birim === 's') ms += sayi * 1000;
    else if (birim === 'm') ms += sayi * 60 * 1000;
    else if (birim === 'h') ms += sayi * 3600 * 1000;
    else if (birim === 'd') ms += sayi * 86400 * 1000;
  }
  return ms;
}

module.exports = {
  isim: 'mute',
  aciklama: 'Bir kullanıcıyı susturur. Kullanım: v!mute @kullanıcı [süre] [sebep]',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin. `v!mute @kullanıcı [10m] [sebep]`');

    const sureMet = args[1];
    const ms = sureMet ? sureCoz(sureMet) : 10 * 60 * 1000; // varsayılan 10dk
    if (!ms || ms > 28 * 86400 * 1000) return mesaj.reply('❌ Geçersiz veya çok uzun süre. Max 28 gün.');

    const sebep = args.slice(2).join(' ') || 'Sebep belirtilmedi';

    await hedef.timeout(ms, `${mesaj.author.tag}: ${sebep}`).catch(e => {
      return mesaj.reply(`❌ Timeout verilemedi: ${e.message}`);
    });

    const embed = new EmbedBuilder()
      .setTitle('🔇 Kullanıcı Susturuldu')
      .addFields(
        { name: 'Kullanıcı', value: `${hedef.user.tag}`, inline: true },
        { name: 'Süre', value: sureMet || '10m', inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.UYARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });
    await hedef.send(`🔇 **${mesaj.guild.name}** sunucusunda susturuldunuz.\n**Süre:** ${sureMet || '10m'}\n**Sebep:** ${sebep}`).catch(() => {});

    const logEmb = logEmbed(
      '🔇 Mute — Kullanıcı Susturuldu',
      `**Kullanıcı:** ${hedef.user.tag}\n**Yetkili:** ${mesaj.author.tag}\n**Süre:** ${sureMet || '10m'}\n**Sebep:** ${sebep}`,
      RENKLER.UYARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
