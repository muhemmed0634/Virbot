// ==========================================
//  VirBot — v!xp / /xp Komutu
//  Level atlama ve XP duyuru kanalı ayarı
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
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('xp')
  .setDescription('Level atlama ve XP bildirimlerinin gönderileceği kanalı ayarlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Level bildirimlerinin gönderileceği metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt
      .setName('islem')
      .setDescription('İşlem türü')
      .setRequired(false)
      .addChoices(
        { name: 'Sıfırla / Kapat (Varsayılan mesaja dön)', value: 'sifirla' },
        { name: 'Mevcut Ayarı Göster', value: 'bilgi' }
      )
  );

module.exports = {
  isim: 'xp',
  aciklama: 'Level atlama ve XP bildirim kanalını ayarlar. Kullanım: v!xp #kanal veya v!xp sifirla',
  alternatifler: ['xp-kanal', 'level-kanal', 'xpkanal', 'levelkanal'],
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu (v!xp #kanal / v!xp sifirla) ────────────
  async calistir(client, mesaj, args) {
    const islem = args[0]?.toLowerCase();

    // 1. Sıfırlama işlemi
    if (islem === 'sifirla' || islem === 'kapat' || islem === 'kaldir') {
      await guildGuncelle(mesaj.guild.id, { xpKanalId: null });

      const embed = new EmbedBuilder()
        .setTitle('🔄 XP Kanalı Sıfırlandı')
        .setDescription('Özel level bildirim kanalı kaldırıldı. Seviye atlama kutlamaları artık kullanıcının mesaj attığı kanala gönderilecek.')
        .setColor(RENKLER.BASARI)
        .setTimestamp();

      await mesaj.reply({ embeds: [embed] });

      const logEmb = logEmbed(
        '🔄 XP Kanalı Sıfırlandı',
        `**Yetkili:** ${mesaj.author.tag}`,
        RENKLER.BILGI
      );
      await logGonder(client, mesaj.guild.id, logEmb);
      return;
    }

    // 2. Kanal belirtilmişse ayarla
    const kanal = mesaj.mentions.channels.first();
    if (kanal) {
      if (kanal.type !== ChannelType.GuildText) {
        return mesaj.reply('❌ Lütfen geçerli bir metin kanalı etiketleyin.');
      }

      await guildGuncelle(mesaj.guild.id, { xpKanalId: kanal.id });

      const embed = new EmbedBuilder()
        .setTitle('✅ XP & Level Kanalı Ayarlandı')
        .setDescription(`Tebrikler! Artık üyeler seviye atladığında bildirimler ${kanal} kanalına gönderilecek.`)
        .setColor(RENKLER.BASARI)
        .setFooter({ text: 'VirBot Level Sistemi' })
        .setTimestamp();

      await mesaj.reply({ embeds: [embed] });

      const logEmb = logEmbed(
        '⭐ XP Kanalı Ayarlandı',
        `**Yetkili:** ${mesaj.author.tag}\n**Yeni XP Kanalı:** ${kanal}`,
        RENKLER.BASARI
      );
      await logGonder(client, mesaj.guild.id, logEmb);
      return;
    }

    // 3. Kanal belirtilmemişse mevcut ayarı göster
    const ayarlar = ayarGetir(mesaj.guild.id);
    const mevcutKanalId = ayarlar?.xpKanalId;
    const mevcutKanal = mevcutKanalId ? mesaj.guild.channels.cache.get(mevcutKanalId) : null;

    const embed = new EmbedBuilder()
      .setTitle('📊 XP & Level Bildirim Kanalı')
      .setDescription(
        mevcutKanal
          ? `Mevcut level bildirim kanalı: ${mevcutKanal} (\`${mevcutKanal.id}\`)\n\n` +
            `• Değiştirmek için: \`v!xp #kanal\` veya \`/xp kanal:#kanal\`\n` +
            `• Sıfırlamak için: \`v!xp sifirla\``
          : 'Henüz özel bir XP kanalı ayarlanmamış. Bildirimler kullanıcının mesajlaştığı kanala gönderiliyor.\n\n' +
            `• Ayarlamak için: \`v!xp #kanal\` veya \`/xp kanal:#kanal\``
      )
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu (/xp) ────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const secilenKanal = interaction.options.getChannel('kanal');
    const secilenIslem = interaction.options.getString('islem');

    // 1. Sıfırlama
    if (secilenIslem === 'sifirla') {
      await guildGuncelle(interaction.guild.id, { xpKanalId: null });

      const embed = new EmbedBuilder()
        .setTitle('🔄 XP Kanalı Sıfırlandı')
        .setDescription('Özel level bildirim kanalı kaldırıldı. Seviye atlama kutlamaları artık mesaj yazılan kanala gönderilecek.')
        .setColor(RENKLER.BASARI)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logEmb = logEmbed(
        '🔄 XP Kanalı Sıfırlandı (Slash)',
        `**Yetkili:** ${interaction.user.tag}`,
        RENKLER.BILGI
      );
      await logGonder(client, interaction.guild.id, logEmb);
      return;
    }

    // 2. Kanal belirtilmişse ayarla
    if (secilenKanal) {
      await guildGuncelle(interaction.guild.id, { xpKanalId: secilenKanal.id });

      const embed = new EmbedBuilder()
        .setTitle('✅ XP & Level Kanalı Ayarlandı')
        .setDescription(`Tebrikler! Artık üyeler seviye atladığında bildirimler ${secilenKanal} kanalına gönderilecek.`)
        .setColor(RENKLER.BASARI)
        .setFooter({ text: 'VirBot Level Sistemi' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logEmb = logEmbed(
        '⭐ XP Kanalı Ayarlandı (Slash)',
        `**Yetkili:** ${interaction.user.tag}\n**Yeni XP Kanalı:** ${secilenKanal}`,
        RENKLER.BASARI
      );
      await logGonder(client, interaction.guild.id, logEmb);
      return;
    }

    // 3. Bilgi / Mevcut durum
    const ayarlar = ayarGetir(interaction.guild.id);
    const mevcutKanalId = ayarlar?.xpKanalId;
    const mevcutKanal = mevcutKanalId ? interaction.guild.channels.cache.get(mevcutKanalId) : null;

    const embed = new EmbedBuilder()
      .setTitle('📊 XP & Level Bildirim Kanalı')
      .setDescription(
        mevcutKanal
          ? `Mevcut level bildirim kanalı: ${mevcutKanal} (\`${mevcutKanal.id}\`)\n\n` +
            `• Değiştirmek için: \`/xp kanal:#kanal\` veya \`v!xp #kanal\`\n` +
            `• Sıfırlamak için: \`/xp islem:sifirla\``
          : 'Henüz özel bir XP kanalı ayarlanmamış. Bildirimler kullanıcının mesajlaştığı kanala gönderiliyor.\n\n' +
            `• Ayarlamak için: \`/xp kanal:#kanal\` veya \`v!xp #kanal\``
      )
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
