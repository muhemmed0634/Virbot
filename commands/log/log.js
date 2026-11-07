// ==========================================
//  VirBot — v!log / /log Komutu
//  Log kanalını ayarlar
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
const { logGonder, logEmbed } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('log')
  .setDescription('Bot loglarının gönderileceği metin kanalını ayarlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(opt =>
    opt
      .setName('kanal')
      .setDescription('Logların iletileceği kanal (Boş bırakılırsa mevcut log kanalını gösterir)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

module.exports = {
  isim: 'log',
  aciklama: 'Bot loglarının gönderileceği kanalı ayarlar.',
  kullanim: 'v!log #kanal',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first() || mesaj.guild.channels.cache.get(args[0]);

    if (!kanal) {
      const mevcut = ayarGetir(mesaj.guild.id);
      const embed = new EmbedBuilder()
        .setTitle('📋 Log Sistemi')
        .setDescription(
          mevcut?.logKanalId
            ? `✅ Mevcut log kanalı: <#${mevcut.logKanalId}>\n\nDeğiştirmek için: \`v!log #yeni-kanal\` veya \`/log kanal:#yeni-kanal\``
            : `❌ Henüz bir log kanalı ayarlanmamış.\n**Kullanım:** \`v!log #kanal\` veya \`/log kanal:#kanal\``
        )
        .setColor(mevcut?.logKanalId ? RENKLER.BASARI : RENKLER.UYARI);
      return mesaj.reply({ embeds: [embed] });
    }

    if (kanal.type !== ChannelType.GuildText) {
      return mesaj.reply('❌ Lütfen geçerli bir metin kanalı belirtin.');
    }

    await guildGuncelle(mesaj.guild.id, { logKanalId: kanal.id });

    const embed = new EmbedBuilder()
      .setTitle('✅ Log Kanalı Ayarlandı')
      .setDescription(
        `Tüm bot denetim logları artık ${kanal} kanalına gönderilecek.\n\n` +
        `**Takip edilecek olaylar:**\n` +
        `🛡️ Yasaklı Kelime, Spam ve Güvenlik Uyarıları\n` +
        `🎫 Ticket açılma/kapanma olayları\n` +
        `🔊 Geçici ses sistemi bildirimleri\n` +
        `🎉 Çekiliş sonuçları\n` +
        `⚠️ Moderasyon ve ceza kayıtları`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });

    const testLog = logEmbed(
      'Log Sistemi Aktif',
      `✅ VirBot log sistemi bu kanala başarıyla bağlandı!\n\n**Ayarlayan:** ${mesaj.author.tag}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, testLog);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const kanal = interaction.options.getChannel('kanal');

    if (!kanal) {
      const mevcut = ayarGetir(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setTitle('📋 Log Sistemi')
        .setDescription(
          mevcut?.logKanalId
            ? `✅ Mevcut log kanalı: <#${mevcut.logKanalId}>\n\nDeğiştirmek için: \`/log kanal:#yeni-kanal\``
            : `❌ Henüz bir log kanalı ayarlanmamış.\n**Kullanım:** \`/log kanal:#kanal\``
        )
        .setColor(mevcut?.logKanalId ? RENKLER.BASARI : RENKLER.UYARI);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (kanal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Lütfen geçerli bir metin kanalı seçin!', ephemeral: true });
    }

    await guildGuncelle(interaction.guild.id, { logKanalId: kanal.id });

    const embed = new EmbedBuilder()
      .setTitle('✅ Log Kanalı Ayarlandı')
      .setDescription(
        `Tüm bot denetim logları artık ${kanal} kanalına gönderilecek.\n\n` +
        `**Takip edilecek olaylar:**\n` +
        `🛡️ Yasaklı Kelime, Spam ve Güvenlik Uyarıları\n` +
        `🎫 Ticket açılma/kapanma olayları\n` +
        `🔊 Geçici ses sistemi bildirimleri\n` +
        `🎉 Çekiliş sonuçları\n` +
        `⚠️ Moderasyon ve ceza kayıtları`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const testLog = logEmbed(
      'Log Sistemi Aktif (Slash)',
      `✅ VirBot log sistemi bu kanala başarıyla bağlandı!\n\n**Ayarlayan:** ${interaction.user.tag}`,
      RENKLER.BASARI,
    );
    await logGonder(client, interaction.guild.id, testLog);
  },
};
