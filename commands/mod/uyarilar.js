// ==========================================
//  VirBot — v!uyarilar / /uyarilar Komutu
//  Kullanıcının uyarılarını listeler, tek tek veya toplu siler
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGetir, kullaniciGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('uyarilar')
  .setDescription('Bir kullanıcının uyarılarını gösterir veya siler.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(opt => opt.setName('hedef').setDescription('Uyarıları görülecek kullanıcı').setRequired(true))
  .addStringOption(opt =>
    opt
      .setName('islem')
      .setDescription('Yapılacak işlem (boş = listele)')
      .setRequired(false)
      .addChoices(
        { name: 'Listele', value: 'liste' },
        { name: 'Tek uyarıyı sil (numara gerekir)', value: 'sil' },
        { name: 'Tüm uyarıları temizle', value: 'temizle' },
      )
  )
  .addIntegerOption(opt => opt.setName('numara').setDescription('Silinecek uyarının numarası').setMinValue(1).setRequired(false));

/**
 * @returns {Promise<{embed?: EmbedBuilder, hata?: string, log?: string}>}
 */
async function uyariIslemi(guild, hedefUser, yetkiliUser, islem = 'liste', numara = null) {
  const kullanici = await kullaniciGetir(hedefUser.id, guild.id);
  const uyarilar = kullanici.uyarilar || [];

  if (islem === 'temizle') {
    if (uyarilar.length === 0) return { hata: '❌ Bu kullanıcının uyarısı yok.' };
    await kullaniciGuncelle(hedefUser.id, guild.id, { uyarilar: [] });
    return {
      embed: new EmbedBuilder()
        .setTitle('🧹 Uyarılar Temizlendi')
        .setDescription(`${hedefUser} kullanıcısının **${uyarilar.length}** uyarısı silindi.`)
        .setColor(RENKLER.BASARI)
        .setTimestamp(),
      log: `**Kullanıcı:** ${hedefUser.tag}\n**Yetkili:** ${yetkiliUser.tag}\n**Silinen:** ${uyarilar.length} uyarı (tümü)`,
    };
  }

  if (islem === 'sil') {
    if (!numara || numara < 1 || numara > uyarilar.length) {
      return { hata: `❌ Geçerli bir uyarı numarası girin (1-${uyarilar.length || 0}).` };
    }
    const silinen = uyarilar[numara - 1];
    const yeni = uyarilar.filter((_, i) => i !== numara - 1);
    await kullaniciGuncelle(hedefUser.id, guild.id, { uyarilar: yeni });
    return {
      embed: new EmbedBuilder()
        .setTitle('🗑️ Uyarı Silindi')
        .setDescription(`${hedefUser} kullanıcısının **#${numara}** uyarısı silindi.\n> ${silinen.sebep}\n\nKalan uyarı: **${yeni.length}**`)
        .setColor(RENKLER.BASARI)
        .setTimestamp(),
      log: `**Kullanıcı:** ${hedefUser.tag}\n**Yetkili:** ${yetkiliUser.tag}\n**Silinen Uyarı:** #${numara} — ${silinen.sebep}`,
    };
  }

  // Listele
  const embed = new EmbedBuilder()
    .setTitle(`⚠️ ${hedefUser.username} — Uyarı Geçmişi`)
    .setThumbnail(hedefUser.displayAvatarURL())
    .setColor(uyarilar.length ? RENKLER.UYARI : RENKLER.BASARI)
    .setFooter({ text: `Toplam ${uyarilar.length} uyarı • Silmek için: /uyarilar islem:sil numara:<no>` })
    .setTimestamp();

  if (uyarilar.length === 0) {
    embed.setDescription('✅ Bu kullanıcının hiç uyarısı yok.');
  } else {
    // En yeni 15 uyarı (embed sınırı)
    const satirlar = uyarilar.map((u, i) => {
      const ts = u.tarih ? `<t:${Math.floor(new Date(u.tarih).getTime() / 1000)}:R>` : '—';
      return `**#${i + 1}** • ${ts} • _${u.veren || 'Bilinmiyor'}_\n> ${String(u.sebep || 'Sebep yok').slice(0, 150)}`;
    }).slice(-15);
    embed.setDescription(satirlar.join('\n').slice(0, 4000));
  }
  return { embed };
}

module.exports = {
  isim: 'uyarilar',
  aciklama: 'Kullanıcının uyarılarını listeler / siler. Kullanım: v!uyarilar @üye [sil <no> | temizle]',
  alternatifler: ['uyarılar', 'warnings', 'warns', 'uyari-sil', 'unwarn'],
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.users.first();
    if (!hedef) return mesaj.reply('❌ Kullanım: `v!uyarilar @üye` | `v!uyarilar @üye sil <no>` | `v!uyarilar @üye temizle`');

    const islem = ['sil', 'temizle'].includes(args[1]?.toLowerCase()) ? args[1].toLowerCase() : 'liste';
    const sonuc = await uyariIslemi(mesaj.guild, hedef, mesaj.author, islem, parseInt(args[2], 10));
    if (sonuc.hata) return mesaj.reply(sonuc.hata);
    await mesaj.reply({ embeds: [sonuc.embed] });
    if (sonuc.log) await logGonder(client, mesaj.guild.id, logEmbed('⚠️ Uyarı Kaydı Değiştirildi', sonuc.log, RENKLER.BILGI));
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) return yetkiRed(interaction);

    const hedef = interaction.options.getUser('hedef');
    const islem = interaction.options.getString('islem') || 'liste';
    const numara = interaction.options.getInteger('numara');
    const sonuc = await uyariIslemi(interaction.guild, hedef, interaction.user, islem, numara);
    if (sonuc.hata) return interaction.reply({ content: sonuc.hata, ephemeral: true });
    await interaction.reply({ embeds: [sonuc.embed], ephemeral: islem === 'liste' });
    if (sonuc.log) await logGonder(client, interaction.guild.id, logEmbed('⚠️ Uyarı Kaydı Değiştirildi', sonuc.log, RENKLER.BILGI));
  },
};
