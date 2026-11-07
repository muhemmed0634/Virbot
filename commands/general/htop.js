// ==========================================
//  VirBot v6 — /htop ve v!htop Komutu
//  Linux htop tarzı interaktif sistem izleme paneli
// ==========================================
'use strict';

const os = require('os');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('htop')
  .setDescription('Sunucu ve bot donanım/kaynak kullanımını görüntüler (htop).')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

function htopEmbedOlustur(client) {
  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Bilinmiyor';
  const cpuCores = cpus ? cpus.length : 1;

  // Bellek
  const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
  const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
  const usedMem = (totalMem - freeMem).toFixed(0);
  const memPercent = Math.round((usedMem / totalMem) * 100);

  // Node Belleği
  const memUsage = process.memoryUsage();
  const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
  const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(1);
  const rss = (memUsage.rss / 1024 / 1024).toFixed(1);

  // Uptime
  const botUptimeMinutes = Math.floor(process.uptime() / 60);
  const botUptimeHours = (botUptimeMinutes / 60).toFixed(1);
  const osUptimeHours = (os.uptime() / 3600).toFixed(1);

  // Yük ortalaması (Linux)
  const loadAvg = os.loadavg ? os.loadavg().map(l => l.toFixed(2)).join(', ') : 'N/A';

  // İlerleme çubuğu
  const barLength = 15;
  const filled = Math.round((memPercent / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  const embed = new EmbedBuilder()
    .setTitle('📊 Sistem İzleyici (htop) — VirBot v6')
    .setColor(memPercent > 85 ? RENKLER.HATA : memPercent > 60 ? RENKLER.UYARI : RENKLER.BASARI)
    .setDescription(
      `\`\`\`prolog\n` +
      `OS          : ${os.type()} ${os.release()} (${os.arch()})\n` +
      `CPU         : ${cpuModel} [${cpuCores} Çekirdek]\n` +
      `Load Avg    : ${loadAvg}\n` +
      `RAM [%]     : [${bar}] ${memPercent}%\n` +
      `RAM [MB]    : ${usedMem}MB / ${totalMem}MB\n` +
      `Process RSS : ${rss}MB (Heap: ${heapUsed}MB / ${heapTotal}MB)\n` +
      `PID         : ${process.pid}\n` +
      `Node Sürüm  : ${process.version}\n` +
      `Bot Uptime  : ${botUptimeHours} saat (${botUptimeMinutes} dk)\n` +
      `OS Uptime   : ${osUptimeHours} saat\n` +
      `\`\`\``
    )
    .addFields(
      { name: '🌐 Sunucular', value: `\`${client.guilds.cache.size}\` sunucu`, inline: true },
      { name: '👥 Üyeler', value: `\`${client.users.cache.size}\` önbellek üye`, inline: true },
      { name: '🏓 Ping', value: `\`${client.ws.ping} ms\``, inline: true }
    )
    .setFooter({ text: 'VirBot v6 • Sistem Durumu' })
    .setTimestamp();

  return embed;
}

module.exports = {
  isim: 'htop',
  aciklama: 'Sunucu donanım ve bellek kullanımını gösterir.',
  alternatifler: ['sistem', 'stats', 'durum'],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj) {
    const embed = htopEmbedOlustur(client);
    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const embed = htopEmbedOlustur(client);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
