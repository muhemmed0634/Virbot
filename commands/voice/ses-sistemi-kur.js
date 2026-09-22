// ==========================================
//  VirBot — Ses Sistemi Kurulumu
//  v!ses-sistemi-kur / /ses-sistemi-kur
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

// ─── Slash Komut Tanımı ────────────────────────────────────
const slashData = new SlashCommandBuilder()
  .setName('ses-sistemi-kur')
  .setDescription('Geçici (Join-to-Create) ses kanalı sistemini kurar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(option =>
    option
      .setName('kategori')
      .setDescription('Geçici ses odalarının açılacağı kategori')
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true)
  );

// ─── Ortak Kurulum Mantığı ─────────────────────────────────
async function sesSisteminiKur(guild, kategori, yetkiliUser) {
  // Kategori altında varsa mevcut 'Kanal Oluştur' ses kanalını bul, yoksa oluştur
  let olusturucuKanal = guild.channels.cache.find(
    c => c.parentId === kategori.id &&
         c.type === ChannelType.GuildVoice &&
         c.name.includes('Kanal Oluştur')
  );

  if (!olusturucuKanal) {
    olusturucuKanal = await guild.channels.create({
      name: '➕ Kanal Oluştur',
      type: ChannelType.GuildVoice,
      parent: kategori.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        },
      ],
    });
  }

  // Veritabanı ve önbelleği güncelle
  await guildGuncelle(guild.id, {
    sesKategoriId: kategori.id,
    sesOlusturKanalId: olusturucuKanal.id,
  });

  const embed = new EmbedBuilder()
    .setTitle('🔊 Ses Sistemi Başarıyla Kuruldu')
    .setDescription(
      `Geçici ses kanalı sistemi başarıyla yapılandırıldı!\n\n` +
      `📁 **Kategori:** \`${kategori.name}\`\n` +
      `➕ **Giriş Kanalı:** <#${olusturucuKanal.id}>\n\n` +
      `Kullanıcılar **<#${olusturucuKanal.id}>** kanalına girdiklerinde, ` +
      `bu kategori altında otomatik olarak kendilerine özel geçici bir ses odası açılacak ve oda boşaldığında silinecektir.`
    )
    .setColor(RENKLER.BASARI)
    .setFooter({ text: 'VirBot v2 • Ses Sistemi' })
    .setTimestamp();

  return { embed, olusturucuKanal };
}

module.exports = {
  isim: 'ses-sistemi-kur',
  aciklama: 'Geçici (Join-to-Create) ses kanalı sistemini kurar. Kategori belirtilmesi gerekir.',
  alternatifler: [
    'ses-sistemi',
    'sessistemi',
    'sessitemi',
    'ses-kur',
    'sessitemi-kur',
    'sessistemikur',
  ],
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu Çalıştırıcı ───────────────────────────
  async calistir(client, mesaj, args) {
    // 'kur' alt argümanı verilmişse kaldır (örn: v!ses-sistemi kur <Kategori>)
    if (args[0] && args[0].toLowerCase() === 'kur') {
      args.shift();
    }

    const input = args.join(' ').trim();
    let kategori = null;

    // 1. Etiket veya ID kontrolü
    if (mesaj.mentions.channels.first() && mesaj.mentions.channels.first().type === ChannelType.GuildCategory) {
      kategori = mesaj.mentions.channels.first();
    } else if (args[0] && mesaj.guild.channels.cache.has(args[0])) {
      const ch = mesaj.guild.channels.cache.get(args[0]);
      if (ch.type === ChannelType.GuildCategory) kategori = ch;
    }

    // 2. İsim ile kategori arama
    if (!kategori && input) {
      kategori = mesaj.guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory &&
             c.name.toLowerCase() === input.toLowerCase()
      );
    }

    if (!kategori) {
      return mesaj.reply(
        '❌ Lütfen ses odalarının açılacağı bir **Kategori ID**\'si veya **Kategori Adı** belirtin!\n\n' +
        '**Kullanım:** `v!ses-sistemi kur <KategoriID | KategoriAdı>`\n' +
        '**Örnek:** `v!ses-sistemi kur Ses Kanalları` veya slash komutu: `/ses-sistemi-kur`'
      );
    }

    // Bot yetki kontrolü
    const botMember = mesaj.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return mesaj.reply('❌ Botun ses kanalı oluşturabilmesi için **Kanalları Yönet (Manage Channels)** yetkisine ihtiyacı vardır.');
    }

    try {
      const { embed, olusturucuKanal } = await sesSisteminiKur(mesaj.guild, kategori, mesaj.author);
      await mesaj.channel.send({ embeds: [embed] });

      const logEmb = logEmbed(
        '🔊 Ses Sistemi Kuruldu',
        `**Yetkili:** ${mesaj.author.tag}\n**Kategori:** ${kategori.name}\n**Oluşturucu Kanal:** ${olusturucuKanal.name}`,
        RENKLER.BASARI,
      );
      await logGonder(client, mesaj.guild.id, logEmb);
    } catch (err) {
      console.error('[SES SİSTEMİ KUR HATA]', err);
      mesaj.reply('❌ Ses sistemi kurulurken bir hata oluştu: ' + err.message);
    }
  },

  // ─── Slash Komutu Çalıştırıcı ────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const kategori = interaction.options.getChannel('kategori');
    if (!kategori || kategori.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: '❌ Lütfen geçerli bir Kategori seçin!',
        ephemeral: true,
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: '❌ Botun ses kanalı oluşturabilmesi için **Kanalları Yönet (Manage Channels)** yetkisine ihtiyacı vardır.',
        ephemeral: true,
      });
    }

    try {
      const { embed, olusturucuKanal } = await sesSisteminiKur(interaction.guild, kategori, interaction.user);
      await interaction.reply({ embeds: [embed] });

      const logEmb = logEmbed(
        '🔊 Ses Sistemi Kuruldu (Slash)',
        `**Yetkili:** ${interaction.user.tag}\n**Kategori:** ${kategori.name}\n**Oluşturucu Kanal:** ${olusturucuKanal.name}`,
        RENKLER.BASARI,
      );
      await logGonder(client, interaction.guild.id, logEmb);
    } catch (err) {
      console.error('[SES SİSTEMİ SLASH HATA]', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Kurulum sırasında bir hata oluştu: ' + err.message, ephemeral: true });
      }
    }
  },
};
