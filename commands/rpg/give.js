// ==========================================
//  VirBot — v!give / /give Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { give } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('give')
  .setDescription('Başka bir kullanıcıya coin transfer edersin.')
  .addUserOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Para göndermek istediğin kullanıcı')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt
      .setName('miktar')
      .setDescription('Göndermek istediğin coin miktarı')
      .setMinValue(1)
      .setRequired(true)
  );

async function paraGonder(gonderen, hedef, guildId, miktar) {
  if (hedef.bot) return { hata: '❌ Botlara para gönderemezsin.' };
  if (hedef.id === gonderen.id) return { hata: '❌ Kendine para gönderemezsin.' };
  if (isNaN(miktar) || miktar <= 0) return { hata: '❌ Geçersiz coin miktarı!' };

  const sonuc = await give(gonderen.id, hedef.id, guildId, miktar);
  if (sonuc.hata) return { hata: sonuc.hata };

  const embed = new EmbedBuilder()
    .setTitle('💸 Para Transferi Gerçekleşti')
    .setDescription(`Başarıyla <@${hedef.id}> kullanıcısına **${sonuc.miktar} 🪙 Coin** gönderdin.`)
    .addFields(
      { name: 'Kalan Bakiyen', value: `${sonuc.gonderenCoin} 🪙`, inline: true },
      { name: 'Alıcının Bakiyesi', value: `${sonuc.hedefCoin} 🪙`, inline: true }
    )
    .setColor(RENKLER.BASARI)
    .setTimestamp();

  return { embed };
}

module.exports = {
  isim: 'give',
  aciklama: 'Başka birine coin gönderirsin.',
  alternatifler: ['gonder', 'pay'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.users.first();
    const miktar = parseInt(args[1]);

    if (!hedef || isNaN(miktar)) {
      return mesaj.reply('❌ Kullanım: `v!give @kullanıcı <miktar>`');
    }

    const res = await paraGonder(mesaj.author, hedef, mesaj.guild.id, miktar);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const hedef = interaction.options.getUser('hedef');
    const miktar = interaction.options.getInteger('miktar');

    const res = await paraGonder(interaction.user, hedef, interaction.guildId, miktar);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
