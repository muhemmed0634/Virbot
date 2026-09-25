// ==========================================
//  VirBot — v!mesajid / /mesajid Komutu
//  Yanıtlanan mesajın veya mevcut kanalın son mesajının ID'sini verir
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('mesajid')
  .setDescription('Yanıtlanan mesajın veya şu anki kanalın son mesajının ID\'sini görüntüler.');

module.exports = {
  isim: 'mesajid',
  alternatifler: ['mesaj-id', 'msgid', 'mid'],
  aciklama: 'Yanıtlanan mesajın ID\'sini gösterir.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  // ─── Prefix Komutu (v!mesajid) ─────────────────────────────
  async calistir(client, mesaj, args) {
    const yanit = mesaj.reference;
    let hedefMesajId = mesaj.id;
    let hedefMesajUrl = mesaj.url;
    let hedefKanal = mesaj.channel;

    if (yanit) {
      try {
        const yanıtlananMesaj = await mesaj.channel.messages.fetch(yanit.messageId);
        hedefMesajId = yanıtlananMesaj.id;
        hedefMesajUrl = yanıtlananMesaj.url;
      } catch (_) {
        hedefMesajId = yanit.messageId;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🆔 Mesaj ID')
      .addFields(
        { name: '📌 Mesaj ID', value: `\`${hedefMesajId}\``, inline: false },
        { name: '📁 Kanal', value: `<#${hedefKanal.id}> (\`${hedefKanal.id}\`)`, inline: false },
        { name: '🔗 Mesaj Linki', value: hedefMesajUrl, inline: false },
      )
      .setColor(RENKLER.BILGI)
      .setFooter({ text: 'ID\'yi kopyalamak için kod bloğuna tıklayın.' })
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu (/mesajid) ───────────────────────────────
  async slashCalistir(client, interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🆔 Mesaj ID — Bilgi')
      .setDescription(
        'Bir mesajın ID\'sini öğrenmek için:\n\n' +
        '1. Mesaja **sağ tıklayın** (Desktop) veya uzun basın (Mobile)\n' +
        '2. **Mesajı Kopyala ID** seçeneğini kullanın\n\n' +
        'Ya da botu prefix komutla kullanın: **O mesaja yanıt vererek** `v!mesajid` yazın.'
      )
      .addFields(
        { name: '📁 Bu Kanalın ID\'si', value: `\`${interaction.channelId}\``, inline: true },
        { name: '🏠 Sunucu ID\'si', value: `\`${interaction.guildId}\``, inline: true },
      )
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
