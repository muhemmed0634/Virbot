// ==========================================
//  VirBot — v!daily / /daily Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { daily } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('24 saatte bir günlük ücretsiz coin ödülünü alırsın.');

async function gunlukOdulAl(userId, guildId) {
  const sonuc = await daily(userId, guildId);
  if (sonuc.hata) return { hata: sonuc.hata };

  const embed = new EmbedBuilder()
    .setTitle('🎁 Günlük Ödül')
    .setDescription(
      `Günlük ödülünü başarıyla topladın!\n\n` +
      `• **Kazanılan:** 🪙 **+${sonuc.odul} Coin**\n` +
      `• **Yeni Bakiye:** **${sonuc.yeniMiktar} 🪙 Coin**`
    )
    .setColor(RENKLER.BASARI)
    .setTimestamp();

  return { embed };
}

module.exports = {
  isim: 'daily',
  aciklama: 'Günlük ödülünü alırsın.',
  alternatifler: ['gunluk'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const res = await gunlukOdulAl(mesaj.author.id, mesaj.guild.id);
    if (res.hata) return mesaj.reply(`❌ ${res.hata}`);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const res = await gunlukOdulAl(interaction.user.id, interaction.guildId);
    if (res.hata) return interaction.reply({ content: `❌ ${res.hata}`, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
