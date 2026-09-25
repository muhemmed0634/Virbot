// ==========================================
//  VirBot — v!coinflip / /coinflip Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { coinflip } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Yazı-tura atarak bahis oynarsın.')
  .addIntegerOption(opt =>
    opt
      .setName('bahis')
      .setDescription('Bahis miktarı')
      .setMinValue(1)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('tahmin')
      .setDescription('Yazı mı Tura mı?')
      .setRequired(true)
      .addChoices(
        { name: 'Yazı', value: 'yazı' },
        { name: 'Tura', value: 'tura' }
      )
  );

async function coinflipOyna(userId, guildId, bahis, tahmin) {
  const t = tahmin.toLowerCase().replace('yazi', 'yazı');
  if (t !== 'yazı' && t !== 'tura') {
    return { hata: '❌ Tahmin "yazı" veya "tura" olmalıdır.' };
  }

  const sonuc = await coinflip(userId, guildId, bahis, t);
  if (sonuc.hata) return { hata: sonuc.hata };

  const embed = new EmbedBuilder()
    .setTitle('🪙 Yazı Tura')
    .setDescription(
      `Havaya bir bozuk para attın...\n\n` +
      `Sonuç: **${sonuc.sonuc.toUpperCase()}**\n\n` +
      `${sonuc.kazandi ? `🎉 **Tebrikler Kazandın!** (+${sonuc.bahis} 🪙)` : `😔 **Kaybettin!** (-${sonuc.bahis} 🪙)`}\n\n` +
      `Güncel Bakiye: **${sonuc.yeniCoin} 🪙 Coin**`
    )
    .setColor(sonuc.kazandi ? RENKLER.BASARI : RENKLER.HATA);

  return { embed };
}

module.exports = {
  isim: 'coinflip',
  aciklama: 'Yazı tura oynarsın.',
  alternatifler: ['cf', 'yazitura'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const bahis = parseInt(args[0]);
    const tahmin = args[1]?.toLowerCase();

    if (isNaN(bahis) || bahis <= 0 || !tahmin) {
      return mesaj.reply('❌ Kullanım: `v!coinflip <bahis> <yazı/tura>`');
    }

    const res = await coinflipOyna(mesaj.author.id, mesaj.guild.id, bahis, tahmin);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const bahis = interaction.options.getInteger('bahis');
    const tahmin = interaction.options.getString('tahmin');

    const res = await coinflipOyna(interaction.user.id, interaction.guildId, bahis, tahmin);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
