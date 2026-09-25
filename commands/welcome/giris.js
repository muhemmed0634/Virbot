// ==========================================
//  VirBot — v!giris / /giris Komutu
//  Giriş ve çıkış (hoş geldin & görüşmek üzere) kanalını ayarlar
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle, ayarGetir } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

const slashData = new SlashCommandBuilder()
  .setName('giris')
  .setDescription('Giriş ve çıkış (resimli karşılama & veda) kanalını ayarlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Giriş ve çıkış kartlarının gönderileceği metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'giris',
  alternatifler: ['giris-cikis', 'giriş', 'cikis', 'çıkış', 'giriş-çıkış'],
  aciklama: 'Giriş ve çıkış (resimli karşılama & veda) kanalını ayarlar.',
  kullanim: 'v!giris #kanal',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu (v!giris #kanal) ────────────────────────
  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first() || mesaj.guild.channels.cache.get(args[0]);

    if (!kanal) {
      const ayarlar = ayarGetir(mesaj.guild.id);
      const mevcutId = ayarlar?.girisKanalId || ayarlar?.girisCikisKanalId || ayarlar?.karsilamaKanalId;
      
      const embed = new EmbedBuilder()
        .setTitle('🚪 Giriş-Çıkış Sistemi')
        .setDescription(
          mevcutId
            ? `✅ Mevcut giriş-çıkış kanalı: <#${mevcutId}>\n\nKanalı değiştirmek için: \`v!giris #kanal\` veya \`/giris kanal:#kanal\``
            : `❌ Henüz bir giriş-çıkış kanalı ayarlanmamış.\n**Kullanım:** \`v!giris #kanal\` veya \`/giris kanal:#kanal\``
        )
        .setColor(mevcutId ? RENKLER.BASARI : RENKLER.UYARI);
      return mesaj.reply({ embeds: [embed] });
    }

    if (kanal.type !== ChannelType.GuildText) {
      return mesaj.reply('❌ Lütfen geçerli bir metin kanalı belirtin.');
    }

    await guildGuncelle(mesaj.guild.id, {
      girisKanalId: kanal.id,
      cikisKanalId: kanal.id,
      girisCikisKanalId: kanal.id,
      karsilamaKanalId: kanal.id,
      vedasKanalId: kanal.id,
    });

    const embed = new EmbedBuilder()
      .setTitle('🚪 Giriş-Çıkış Kanalı Ayarlandı')
      .setDescription(
        `Yeni katılan ve ayrılan üyelerin resimli (Canvas) bildirim kartları artık ${kanal} kanalına gönderilecek.\n\n` +
        `• **Giriş Kartı:** Neon yeşil detaylı modern karşılama paneli\n` +
        `• **Çıkış Kartı:** Neon kırmızı detaylı modern veda paneli`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🚪 Giriş-Çıkış Kanalı Değiştirildi',
      `**Yetkili:** ${mesaj.author.tag} (<@${mesaj.author.id}>)\n**Kanal:** ${kanal} (\`${kanal.id}\`)`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu (/giris) ─────────────────────────────────
  async slashCalistir(client, interaction) {
    const kanal = interaction.options.getChannel('kanal');

    if (!kanal) {
      const ayarlar = ayarGetir(interaction.guild.id);
      const mevcutId = ayarlar?.girisKanalId || ayarlar?.girisCikisKanalId || ayarlar?.karsilamaKanalId;

      const embed = new EmbedBuilder()
        .setTitle('🚪 Giriş-Çıkış Sistemi')
        .setDescription(
          mevcutId
            ? `✅ Mevcut giriş-çıkış kanalı: <#${mevcutId}>\n\nKanalı değiştirmek için: \`/giris kanal:#yeni-kanal\``
            : `❌ Henüz bir giriş-çıkış kanalı ayarlanmamış.\n**Kullanım:** \`/giris kanal:#kanal\``
        )
        .setColor(mevcutId ? RENKLER.BASARI : RENKLER.UYARI);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (kanal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Lütfen geçerli bir metin kanalı belirtin.', ephemeral: true });
    }

    await guildGuncelle(interaction.guild.id, {
      girisKanalId: kanal.id,
      cikisKanalId: kanal.id,
      girisCikisKanalId: kanal.id,
      karsilamaKanalId: kanal.id,
      vedasKanalId: kanal.id,
    });

    const embed = new EmbedBuilder()
      .setTitle('🚪 Giriş-Çıkış Kanalı Ayarlandı')
      .setDescription(
        `Yeni katılan ve ayrılan üyelerin resimli (Canvas) bildirim kartları artık ${kanal} kanalına gönderilecek.\n\n` +
        `• **Giriş Kartı:** Neon yeşil detaylı modern karşılama paneli\n` +
        `• **Çıkış Kartı:** Neon kırmızı detaylı modern veda paneli`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🚪 Giriş-Çıkış Kanalı Değiştirildi',
      `**Yetkili:** ${interaction.user.tag} (<@${interaction.user.id}>)\n**Kanal:** ${kanal} (\`${kanal.id}\`)`,
      RENKLER.BASARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
