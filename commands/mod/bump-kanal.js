// ==========================================
//  VirBot v6 — /bump-kanal ve v!bump-kanal Komutu
//  Disboard bump kanalı ayarlar, anında test eder ve 2 saatlik döngüyü başlatır
// ==========================================
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { bumpKanalAyarla } = require('../../modules/bump/bumpManager');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('bump-kanal')
  .setDescription('Disboard otomatik bump kanalını ayarlar (2 saatte bir çalışır).')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Bump mesajlarının gönderileceği kanal (boş bırakılırsa kaldırılır)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'bump-kanal',
  aciklama: 'Disboard otomatik bump kanalını ayarlar. Kullanım: v!bump-kanal #kanal',
  alternatifler: ['bumpkanal', 'disboard-kanal', 'bump'],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels?.first() || (args[0] ? mesaj.guild.channels.cache.get(args[0]) : null);

    if (!kanal && args[0]) {
      return mesaj.reply('❌ Geçerli bir metin kanalı etiketleyin! `v!bump-kanal #kanal`');
    }

    await bumpKanalAyarla(mesaj.guild.id, kanal, client);

    const embed = new EmbedBuilder()
      .setTitle('🚀 Disboard Bump Kanalı Güncellendi')
      .setColor(RENKLER.BASARI)
      .setDescription(
        kanal
          ? `✅ Bump kanalı ${kanal} olarak ayarlandı.\n` +
            `> Test mesajı gönderildi! Artık her **2 saatte bir** otomatik bump hatırlatması ve tetiklemesi yapılacaktır.`
          : '❌ Otomatik bump sistemi bu sunucu için devre dışı bırakıldı.'
      )
      .setFooter({ text: 'VirBot v6 • Disboard Entegrasyonu' })
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const kanal = interaction.options.getChannel('kanal');
    await interaction.deferReply({ ephemeral: true });

    await bumpKanalAyarla(interaction.guild.id, kanal, client);

    const embed = new EmbedBuilder()
      .setTitle('🚀 Disboard Bump Kanalı Güncellendi')
      .setColor(RENKLER.BASARI)
      .setDescription(
        kanal
          ? `✅ Bump kanalı ${kanal} olarak ayarlandı.\n` +
            `> Test mesajı gönderildi! Artık her **2 saatte bir** otomatik bump hatırlatması yapılacaktır.`
          : '❌ Otomatik bump sistemi bu sunucu için devre dışı bırakıldı.'
      )
      .setFooter({ text: 'VirBot v6 • Disboard Entegrasyonu' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
