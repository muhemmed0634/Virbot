// ==========================================
//  VirBot v6 — /mesaj ve v!mesaj Komutu
//  Botun belirtilen kanala mesaj yazmasını sağlar
// ==========================================
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const slashData = new SlashCommandBuilder()
  .setName('mesaj')
  .setDescription('Bota belirtilen kanalda mesaj yazdırır.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(opt =>
    opt.setName('metin').setDescription('Gönderilecek mesaj').setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Mesajın gönderileceği kanal (boş bırakılırsa bu kanal)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'mesaj',
  aciklama: 'Bota mesaj yazdırır. Kullanım: v!mesaj [#kanal] <metin>',
  alternatifler: ['yazdir', 'say'],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    if (!args[0]) {
      return mesaj.reply('❌ Lütfen yazılacak mesajı girin! `v!mesaj [#kanal] <metin>`');
    }

    let hedefKanal = mesaj.mentions.channels?.first();
    let metin = '';

    if (hedefKanal) {
      metin = args.slice(1).join(' ');
    } else {
      hedefKanal = mesaj.channel;
      metin = args.join(' ');
    }

    if (!metin.trim()) {
      return mesaj.reply('❌ Mesaj metni boş olamaz!');
    }

    // Orijinal komut mesajını sil
    if (mesaj.deletable) await mesaj.delete().catch(() => {});

    await hedefKanal.send(metin).catch(err => {
      mesaj.channel.send(`❌ Mesaj gönderilemedi: ${err.message}`).catch(() => {});
    });
  },

  async slashCalistir(client, interaction) {
    const metin = interaction.options.getString('metin');
    const hedefKanal = interaction.options.getChannel('kanal') || interaction.channel;

    try {
      await hedefKanal.send(metin);
      await interaction.reply({ content: `✅ Mesaj başarıyla ${hedefKanal} kanalına gönderildi.`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Mesaj gönderilemedi: ${err.message}`, ephemeral: true });
    }
  },
};
