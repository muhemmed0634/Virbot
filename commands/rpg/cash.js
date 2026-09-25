// ==========================================
//  VirBot — v!cash / /cash Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGetir } = require('../../modules/data/dataManager');

const slashData = new SlashCommandBuilder()
  .setName('cash')
  .setDescription('Cüzdanındaki veya başka bir kullanıcının coin bakiyesini gösterir.')
  .addUserOption(opt =>
    opt
      .setName('kullanici')
      .setDescription('Bakiyesine bakmak istediğin kullanıcı (boş bırakırsan kendin)')
      .setRequired(false)
  );

async function bakiyeGoster(hedefUser, guildId) {
  if (hedefUser.bot) return { hata: '❌ Botların cüzdanı bulunmaz.' };

  const kullanici = await kullaniciGetir(hedefUser.id, guildId);

  const embed = new EmbedBuilder()
    .setTitle(`💳 Cüzdan Bakiyesi`)
    .setDescription(`**${hedefUser.username}** kullanıcısının varlığı:`)
    .addFields(
      { name: '🪙 Coin', value: `**${kullanici.coins.toLocaleString('tr-TR')}** 🪙`, inline: true },
      { name: '🐾 Hayvanat Bahçesi', value: `${kullanici.zoo?.length || 0} hayvan`, inline: true }
    )
    .setColor(RENKLER.RPG)
    .setThumbnail(hedefUser.displayAvatarURL())
    .setFooter({ text: 'VirBot Ekonomi • Market için /market yazın' });

  return { embed };
}

module.exports = {
  isim: 'cash',
  aciklama: 'Coin bakiyeni gösterir.',
  alternatifler: ['para', 'bakiye', 'coin'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.users.first() || mesaj.author;
    const res = await bakiyeGoster(hedef, mesaj.guild.id);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const hedef = interaction.options.getUser('kullanici') || interaction.user;
    const res = await bakiyeGoster(hedef, interaction.guildId);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
