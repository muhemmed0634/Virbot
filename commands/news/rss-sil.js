// ==========================================
//  VirBot — v!rss-sil / /rss-sil Komutu
//  Bağlı RSS kaynaklarını listeler ve kaldırır
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { rssGetir, rssKaydetDB } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('rss-sil')
  .setDescription('Bağlı RSS/haber kaynaklarını listeler veya birini kaldırır.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addIntegerOption(opt =>
    opt.setName('numara').setDescription('Kaldırılacak kaynağın numarası (boş = listele)').setMinValue(1).setRequired(false)
  );

function listeEmbed(kaynaklar) {
  const embed = new EmbedBuilder()
    .setTitle('📡 Bağlı RSS Kaynakları')
    .setColor(RENKLER.HABER)
    .setTimestamp();
  if (!kaynaklar.length) {
    return embed.setDescription('Henüz bağlı bir RSS kaynağı yok.\nEklemek için: `/haber` veya `/rss-ekle`');
  }
  return embed
    .setDescription(kaynaklar.map((k, i) => `**${i + 1}.** <#${k.kanalId}>\n\`${k.url.slice(0, 100)}\``).join('\n\n').slice(0, 4000))
    .setFooter({ text: 'Kaldırmak için: /rss-sil numara:<no> veya v!rss-sil <no>' });
}

async function rssIslem(client, guild, yetkiliUser, numara) {
  const kaynaklar = [...rssGetir(guild.id)];
  if (!numara) return { embed: listeEmbed(kaynaklar) };

  if (numara < 1 || numara > kaynaklar.length) {
    return { hata: `❌ Geçersiz numara. 1 ile ${kaynaklar.length} arasında olmalı. (Liste için: \`/rss-sil\`)` };
  }
  const [silinen] = kaynaklar.splice(numara - 1, 1);
  await rssKaydetDB(guild.id, kaynaklar);

  await logGonder(client, guild.id, logEmbed(
    '📡 RSS Kaynağı Kaldırıldı',
    `**Yetkili:** ${yetkiliUser.tag}\n**Kanal:** <#${silinen.kanalId}>\n**URL:** \`${silinen.url}\``,
    RENKLER.UYARI,
  ));

  return {
    embed: new EmbedBuilder()
      .setTitle('🗑️ RSS Kaynağı Kaldırıldı')
      .setDescription(`\`${silinen.url}\` kaynağı <#${silinen.kanalId}> kanalından kaldırıldı.\nKalan kaynak: **${kaynaklar.length}**`)
      .setColor(RENKLER.BASARI)
      .setTimestamp(),
  };
}

module.exports = {
  isim: 'rss-sil',
  aciklama: 'RSS kaynaklarını listeler / kaldırır. Kullanım: v!rss-sil [numara]',
  alternatifler: ['rss-liste', 'rssliste', 'rsssil', 'haber-sil'],
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    const sonuc = await rssIslem(client, mesaj.guild, mesaj.author, parseInt(args[0], 10) || null);
    if (sonuc.hata) return mesaj.reply(sonuc.hata);
    await mesaj.reply({ embeds: [sonuc.embed] });
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) return yetkiRed(interaction);
    const sonuc = await rssIslem(client, interaction.guild, interaction.user, interaction.options.getInteger('numara'));
    if (sonuc.hata) return interaction.reply({ content: sonuc.hata, ephemeral: true });
    await interaction.reply({ embeds: [sonuc.embed], ephemeral: true });
  },
};
