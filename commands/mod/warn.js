// ==========================================
//  VirBot — v!warn / /warn Komutu
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGetir, kullaniciGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Bir kullanıcıya resmi uyarı verir.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Uyarılacak kullanıcı')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('sebep')
      .setDescription('Uyarı sebebi')
      .setRequired(false)
  );

module.exports = {
  isim: 'warn',
  aciklama: 'Bir kullanıcıya uyarı verir.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin: `v!warn @kullanıcı [sebep]`');
    if (hedef.user.bot) return mesaj.reply('❌ Botlara uyarı verilemez.');

    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    const uyariVeri = { sebep, tarih: new Date(), veren: mesaj.author.tag };

    const kullanici = await kullaniciGetir(hedef.id, mesaj.guild.id);
    const mevcutUyarilar = kullanici.uyarilar || [];
    mevcutUyarilar.push(uyariVeri);

    await kullaniciGuncelle(hedef.id, mesaj.guild.id, { uyarilar: mevcutUyarilar });

    await hedef.send(
      `⚠️ **${mesaj.guild.name}** sunucusunda uyarı aldınız.\n**Sebep:** ${sebep}\n**Toplam Uyarı:** ${mevcutUyarilar.length}`
    ).catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Uyarı Verildi')
      .addFields(
        { name: 'Kullanıcı', value: `${hedef.user.tag}`, inline: true },
        { name: 'Yetkili', value: mesaj.author.tag, inline: true },
        { name: 'Toplam Uyarı', value: `${mevcutUyarilar.length}`, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.UYARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '⚠️ Warn — Uyarı Verildi',
      `**Kullanıcı:** ${hedef.user.tag}\n**Yetkili:** ${mesaj.author.tag}\n**Toplam:** ${mevcutUyarilar.length}\n**Sebep:** ${sebep}`,
      RENKLER.UYARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const hedefUser = interaction.options.getUser('hedef');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    if (hedefUser.bot) {
      return interaction.reply({ content: '❌ Botlara uyarı verilemez.', ephemeral: true });
    }

    const uyariVeri = { sebep, tarih: new Date(), veren: interaction.user.tag };

    const kullanici = await kullaniciGetir(hedefUser.id, interaction.guildId);
    const mevcutUyarilar = kullanici.uyarilar || [];
    mevcutUyarilar.push(uyariVeri);

    await kullaniciGuncelle(hedefUser.id, interaction.guildId, { uyarilar: mevcutUyarilar });

    await hedefUser.send(
      `⚠️ **${interaction.guild.name}** sunucusunda uyarı aldınız.\n**Sebep:** ${sebep}\n**Toplam Uyarı:** ${mevcutUyarilar.length}`
    ).catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Uyarı Verildi')
      .addFields(
        { name: 'Kullanıcı', value: `${hedefUser.tag}`, inline: true },
        { name: 'Yetkili', value: interaction.user.tag, inline: true },
        { name: 'Toplam Uyarı', value: `${mevcutUyarilar.length}`, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.UYARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '⚠️ Warn — Uyarı Verildi (Slash)',
      `**Kullanıcı:** ${hedefUser.tag}\n**Yetkili:** ${interaction.user.tag}\n**Toplam:** ${mevcutUyarilar.length}\n**Sebep:** ${sebep}`,
      RENKLER.UYARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
