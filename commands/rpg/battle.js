// ==========================================
//  VirBot — v!battle / /battle Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { battle } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('Başka bir kullanıcıyla RPG düellosu yaparsın.')
  .addUserOption(opt =>
    opt
      .setName('rakip')
      .setDescription('Düello yapmak istediğin kullanıcı')
      .setRequired(true)
  );

async function duelloYap(saldirgan, hedef, guildId) {
  if (hedef.bot) return { hata: '❌ Botlarla savaşamazsın.' };
  if (hedef.id === saldirgan.id) return { hata: '❌ Kendine saldıramazsın.' };

  const sonuc = await battle(saldirgan.id, hedef.id, guildId);

  const kazananUye = sonuc.kazanan === saldirgan.id ? saldirgan : hedef;

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Düello Sonucu!')
    .setDescription(`**${saldirgan.username}** (Güç: ${sonuc.saldirganGuc}) 🆚 **${hedef.username}** (Güç: ${sonuc.hedefGuc})`)
    .addFields(
      { name: '🏆 Kazanan', value: `<@${sonuc.kazanan}>`, inline: true },
      { name: '💀 Kaybeden', value: `<@${sonuc.kaybeden}>`, inline: true },
      { name: '💰 Ödül', value: `Kazanan **${sonuc.odul} 🪙 Coin** ganimet elde etti!` }
    )
    .setColor(RENKLER.RPG)
    .setThumbnail(kazananUye.displayAvatarURL());

  return { embed };
}

module.exports = {
  isim: 'battle',
  aciklama: 'Başka bir kullanıcıyla düello yaparsın.',
  alternatifler: ['savas', 'düello', 'duello'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.users.first();
    if (!hedef) {
      return mesaj.reply('❌ Kime saldırmak istediğini etiketle: `v!battle @kullanıcı`');
    }

    const res = await duelloYap(mesaj.author, hedef, mesaj.guild.id);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const hedef = interaction.options.getUser('rakip');
    const res = await duelloYap(interaction.user, hedef, interaction.guildId);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
