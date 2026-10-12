// ==========================================
//  VirBot v6 — /basvuru ve v!basvuru Komutu
//  Yetkili başvuru panelini gönderir (Butonlu & Modallı)
// ==========================================
'use strict';

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('basvuru')
  .setDescription('Sunucu için interaktif yetkili başvuru paneli gönderir.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Başvuru panelinin gönderileceği kanal (boş bırakılırsa bu kanal)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'basvuru',
  aciklama: 'Yetkili başvuru paneli gönderir. Kullanım: v!basvuru [#kanal]',
  alternatifler: ['basvuru-olustur', 'basvuru-kur'],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels?.first() || mesaj.channel;

    const embed = new EmbedBuilder()
      .setTitle('📋 Yetkili Başvuru Formu')
      .setDescription(
        `Sunucumuzun yönetim ekibine katılmak, düzeni sağlamak ve topluluğumuza destek olmak ister misiniz?\n\n` +
        `> Aşağıdaki **"📩 Başvuru Yap"** butonuna tıklayarak açılan formu doldurabilir ve başvurunuzu doğrudan yöneticilerimize iletebilirsiniz.\n\n` +
        `**Aranan Şartlar:**\n` +
        `• Aktif ve saygılı olmak\n` +
        `• Sunucu kurallarına hakim olmak\n` +
        `• Ekip çalışmasına uyum sağlayabilmek`
      )
      .setColor(RENKLER.BIRINCIL || 0x5865F2)
      .setThumbnail(mesaj.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `${mesaj.guild.name} • Yetkili Alımları | VirBot v6` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('basvuru_yap')
        .setLabel('📩 Başvuru Yap')
        .setStyle(ButtonStyle.Primary)
    );

    await kanal.send({ embeds: [embed], components: [row] });
    if (kanal.id !== mesaj.channel.id) {
      await mesaj.reply(`✅ Başvuru paneli başarıyla ${kanal} kanalına gönderildi.`);
    }
  },

  async slashCalistir(client, interaction) {
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('📋 Yetkili Başvuru Formu')
      .setDescription(
        `Sunucumuzun yönetim ekibine katılmak, düzeni sağlamak ve topluluğumuza destek olmak ister misiniz?\n\n` +
        `> Aşağıdaki **"📩 Başvuru Yap"** butonuna tıklayarak açılan formu doldurabilir ve başvurunuzu doğrudan yöneticilerimize iletebilirsiniz.\n\n` +
        `**Aranan Şartlar:**\n` +
        `• Aktif ve saygılı olmak\n` +
        `• Sunucu kurallarına hakim olmak\n` +
        `• Ekip çalışmasına uyum sağlayabilmek`
      )
      .setColor(RENKLER.BIRINCIL || 0x5865F2)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `${interaction.guild.name} • Yetkili Alımları | VirBot v6` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('basvuru_yap')
        .setLabel('📩 Başvuru Yap')
        .setStyle(ButtonStyle.Primary)
    );

    await kanal.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Başvuru paneli başarıyla ${kanal} kanalına gönderildi.`, ephemeral: true });
  },
};
