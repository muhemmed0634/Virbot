// ==========================================
//  VirBot — v!mute / /mute Komutu (Timeout)
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

function sureCoz(metin) {
  const eslesmeler = metin.match(/(\d+)(s|m|h|d)/gi);
  if (!eslesmeler) return null;
  let ms = 0;
  for (const e of eslesmeler) {
    const sayi = parseInt(e);
    const birim = e.slice(-1).toLowerCase();
    if (birim === 's') ms += sayi * 1000;
    else if (birim === 'm') ms += sayi * 60 * 1000;
    else if (birim === 'h') ms += sayi * 3600 * 1000;
    else if (birim === 'd') ms += sayi * 86400 * 1000;
  }
  return ms;
}

const slashData = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Bir kullanıcıyı geçici olarak susturur (Timeout).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Susturulacak kullanıcı')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('sure')
      .setDescription('Susturma süresi (örn: 10m, 1h, 1d) - Varsayılan: 10m')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt
      .setName('sebep')
      .setDescription('Susturma sebebi')
      .setRequired(false)
  );

module.exports = {
  isim: 'mute',
  aciklama: 'Bir kullanıcıyı susturur. Kullanım: v!mute @kullanıcı [süre] [sebep]',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin: `v!mute @kullanıcı [10m] [sebep]`');

    const sureMet = args[1];
    const ms = sureMet ? sureCoz(sureMet) : 10 * 60 * 1000;
    if (!ms || ms > 28 * 86400 * 1000) return mesaj.reply('❌ Geçersiz veya çok uzun süre. Max 28 gün.');

    const sebep = args.slice(2).join(' ') || 'Sebep belirtilmedi';

    await hedef.timeout(ms, `${mesaj.author.tag}: ${sebep}`).catch(e => {
      return mesaj.reply(`❌ Timeout verilemedi: ${e.message}`);
    });

    const embed = new EmbedBuilder()
      .setTitle('🔇 Kullanıcı Susturuldu')
      .addFields(
        { name: 'Kullanıcı', value: `${hedef.user.tag}`, inline: true },
        { name: 'Süre', value: sureMet || '10m', inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.UYARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });
    await hedef.send(`🔇 **${mesaj.guild.name}** sunucusunda susturuldunuz.\n**Süre:** ${sureMet || '10m'}\n**Sebep:** ${sebep}`).catch(() => {});

    const logEmb = logEmbed(
      '🔇 Mute — Kullanıcı Susturuldu',
      `**Kullanıcı:** ${hedef.user.tag}\n**Yetkili:** ${mesaj.author.tag}\n**Süre:** ${sureMet || '10m'}\n**Sebep:** ${sebep}`,
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
    const sureMet = interaction.options.getString('sure') || '10m';
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    const hedefMember = await interaction.guild.members.fetch(hedefUser.id).catch(() => null);
    if (!hedefMember) {
      return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    }

    const ms = sureCoz(sureMet);
    if (!ms || ms > 28 * 86400 * 1000) {
      return interaction.reply({ content: '❌ Geçersiz veya çok uzun süre! Max 28 gün (örn: 10m, 1h, 1d).', ephemeral: true });
    }

    try {
      await hedefMember.timeout(ms, `${interaction.user.tag}: ${sebep}`);
    } catch (err) {
      return interaction.reply({ content: `❌ Timeout uygulanamadı: ${err.message}`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔇 Kullanıcı Susturuldu')
      .addFields(
        { name: 'Kullanıcı', value: `${hedefUser.tag}`, inline: true },
        { name: 'Süre', value: sureMet, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.UYARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await hedefMember.send(`🔇 **${interaction.guild.name}** sunucusunda susturuldunuz.\n**Süre:** ${sureMet}\n**Sebep:** ${sebep}`).catch(() => {});

    const logEmb = logEmbed(
      '🔇 Mute — Kullanıcı Susturuldu (Slash)',
      `**Kullanıcı:** ${hedefUser.tag}\n**Yetkili:** ${interaction.user.tag}\n**Süre:** ${sureMet}\n**Sebep:** ${sebep}`,
      RENKLER.UYARI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
