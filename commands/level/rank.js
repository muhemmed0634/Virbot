// ==========================================
//  VirBot — v!rank Komutu
// ==========================================
'use strict';

const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const { kullaniciGetir, liderTabelaGetir } = require('../../modules/data/dataManager');
const { rankKartOlustur } = require('../../modules/level/levelManager');

const slashData = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Kullanıcının seviye kartını gösterir.')
  .addUserOption(opt =>
    opt
      .setName('uye')
      .setDescription('Seviye kartını görmek istediğiniz üye (boş bırakılırsa kendiniz)')
      .setRequired(false)
  );

module.exports = {
  isim: 'rank',
  aciklama: 'Kullanıcının seviye kartını gösterir.',
  alternatifler: ['seviye', 'level'],
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first() || mesaj.member;
    if (hedef.user.bot) return mesaj.reply('❌ Botların seviyesi olmaz!');

    const bekle = await mesaj.reply('⏳ Rank kartınız oluşturuluyor...');

    try {
      const kullanici = await kullaniciGetir(hedef.id, mesaj.guild.id);
      const tabela = await liderTabelaGetir(mesaj.guild.id, 100);
      let sira = tabela.findIndex(u => u.userId === hedef.id) + 1;
      if (sira === 0) sira = tabela.length + 1;

      const buffer = await rankKartOlustur(hedef, kullanici, sira);
      const ek = new AttachmentBuilder(buffer, { name: 'rank.png' });

      await bekle.edit({ content: null, files: [ek] });
    } catch (hata) {
      console.error('[RANK HATASI]', hata);
      await bekle.edit('❌ Kart oluşturulurken bir hata oluştu.');
    }
  },

  async slashCalistir(client, interaction) {
    const hedef = interaction.options.getMember('uye') || interaction.member;
    if (hedef.user.bot) return interaction.reply({ content: '❌ Botların seviyesi olmaz!', ephemeral: true });

    await interaction.deferReply();

    try {
      const kullanici = await kullaniciGetir(hedef.id, interaction.guild.id);
      const tabela = await liderTabelaGetir(interaction.guild.id, 100);
      let sira = tabela.findIndex(u => u.userId === hedef.id) + 1;
      if (sira === 0) sira = tabela.length + 1;

      const buffer = await rankKartOlustur(hedef, kullanici, sira);
      const ek = new AttachmentBuilder(buffer, { name: 'rank.png' });

      await interaction.editReply({ files: [ek] });
    } catch (hata) {
      console.error('[RANK HATASI]', hata);
      await interaction.editReply({ content: '❌ Kart oluşturulurken bir hata oluştu.' });
    }
  },
};
