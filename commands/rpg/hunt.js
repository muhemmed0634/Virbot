// ==========================================
//  VirBot — v!hunt / /hunt Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { hunt, nadirRenk, nadirYildiz } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('hunt')
  .setDescription('Ormana gidip vahşi hayvan avlar ve coin kazanır.');

async function avlanmaYap(userId, guildId, kullaniciAdi) {
  const sonuc = await hunt(userId, guildId);
  if (sonuc.hata) return { hata: sonuc.hata };

  const { hayvan, coinKazanc, toplamZoo } = sonuc;

  const embed = new EmbedBuilder()
    .setTitle(`🏹 ${kullaniciAdi} Avlandı!`)
    .setDescription(
      `Ormanın derinliklerinde karşına **${hayvan.isim}** çıktı!\n` +
      `Başarıyla yakalayıp hayvanat bahçene ekledin.\n\n` +
      `• **Nadirliği:** ${nadirYildiz(hayvan.nadir)} ${hayvan.nadir}\n` +
      `• **Kazancın:** 🪙 **${coinKazanc} Coin**\n` +
      `• **Zoo Toplamı:** ${toplamZoo} hayvan`
    )
    .setColor(nadirRenk(hayvan.nadir))
    .setFooter({ text: 'VirBot RPG • Silah ve Zırh almak için /market yazın.' });

  return { embed };
}

module.exports = {
  isim: 'hunt',
  aciklama: 'Ormana gidip hayvan avlar. (30sn bekleme süresi)',
  alternatifler: ['av', 'avlan'],
  adminGerekli: false,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const res = await avlanmaYap(mesaj.author.id, mesaj.guild.id, mesaj.author.username);
    if (res.hata) return mesaj.reply(`❌ ${res.hata}`);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const res = await avlanmaYap(interaction.user.id, interaction.guildId, interaction.user.username);
    if (res.hata) return interaction.reply({ content: `❌ ${res.hata}`, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
