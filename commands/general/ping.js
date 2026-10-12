// ==========================================
//  VirBot v6 — /ping ve v!ping Komutu
//  Bot gecikmesi ve sistem durumunu gösterir
// ==========================================
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Botun gecikme sürelerini ve durumunu görüntüler.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = {
  isim: 'ping',
  aciklama: 'Botun gecikme sürelerini gösterir.',
  alternatifler: ['gecikme', 'ms'],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj) {
    const baslangic = Date.now();
    const tempMsg = await mesaj.reply('🏓 Ping ölçülüyor...');
    const mesajGecikmesi = Date.now() - baslangic;
    const wsPing = client.ws.ping;

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong! — VirBot v6')
      .setColor(wsPing < 120 ? RENKLER.BASARI : wsPing < 250 ? RENKLER.UYARI : RENKLER.HATA)
      .addFields(
        { name: '🌐 WebSocket Ping', value: `\`${wsPing >= 0 ? wsPing : 'Hesaplanıyor...'} ms\``, inline: true },
        { name: '📨 Mesaj Gecikmesi', value: `\`${mesajGecikmesi} ms\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${Math.floor(process.uptime() / 60)} dakika\``, inline: true }
      )
      .setFooter({ text: 'VirBot v6 Performans Paneli' })
      .setTimestamp();

    await tempMsg.edit({ content: null, embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const baslangic = Date.now();
    await interaction.reply({ content: '🏓 Ping ölçülüyor...', ephemeral: true });
    const mesajGecikmesi = Date.now() - baslangic;
    const wsPing = client.ws.ping;

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong! — VirBot v6')
      .setColor(wsPing < 120 ? RENKLER.BASARI : wsPing < 250 ? RENKLER.UYARI : RENKLER.HATA)
      .addFields(
        { name: '🌐 WebSocket Ping', value: `\`${wsPing >= 0 ? wsPing : 'Hesaplanıyor...'} ms\``, inline: true },
        { name: '📨 Yanıt Süresi', value: `\`${mesajGecikmesi} ms\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${Math.floor(process.uptime() / 60)} dakika\``, inline: true }
      )
      .setFooter({ text: 'VirBot v6 Performans Paneli' })
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
