// ==========================================
//  VirBot — v!equip / /equip Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { equip } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('equip')
  .setDescription('Mevcut silah veya zırhını kontrol edersin.')
  .addStringOption(opt =>
    opt
      .setName('tip')
      .setDescription('Kuşanılan ekipman türü')
      .setRequired(true)
      .addChoices(
        { name: 'Silah', value: 'silah' },
        { name: 'Zırh', value: 'zirh' }
      )
  );

async function ekipmanGoster(userId, guildId, tip) {
  const sonuc = await equip(userId, guildId, tip);
  if (sonuc.hata) return { hata: sonuc.hata };

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ ${sonuc.tip} Durumu`)
    .setDescription(
      `Mevcut ${sonuc.tip}: **${sonuc.ekipman.isim}**\n` +
      `Sağladığı Güç Bonusu: **+${sonuc.ekipman.guc}**\n\n` +
      `Daha güçlü eşyalar almak için: \`/market\``
    )
    .setColor(RENKLER.RPG)
    .setTimestamp();

  return { embed };
}

module.exports = {
  isim: 'equip',
  aciklama: 'Sahip olduğun zırh veya silahı gösterir. (v!equip silah / v!equip zirh)',
  alternatifler: ['kusan'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const tip = args[0]?.toLowerCase();
    if (tip !== 'silah' && tip !== 'zirh') {
      return mesaj.reply('❌ Neyi kuşanmak istiyorsun? `v!equip silah` veya `v!equip zirh` yaz.');
    }

    const res = await ekipmanGoster(mesaj.author.id, mesaj.guild.id, tip);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const tip = interaction.options.getString('tip');
    const res = await ekipmanGoster(interaction.user.id, interaction.guildId, tip);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
