// ==========================================
//  VirBot v5 — v!ban / /ban Komutu
//  DM Bildirimi, Geçici Ban, Mesaj Silme
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
const { geciciBanEkle } = require('../../modules/mod/tempBanManager');

// "2d", "12h", "1d12h" → saat (prefix komutu için)
function sureSaatCoz(metin) {
  if (!metin || !/^(\d+[hd])+$/i.test(metin)) return null;
  let saat = 0;
  for (const [, sayi, birim] of metin.matchAll(/(\d+)([hd])/gi)) {
    saat += parseInt(sayi, 10) * (birim.toLowerCase() === 'd' ? 24 : 1);
  }
  return saat > 0 && saat <= 8760 ? saat : null;
}

const slashData = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bir kullanıcıyı sunucudan yasaklar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Yasaklanacak kullanıcı')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('sebep')
      .setDescription('Yasaklama sebebi')
      .setRequired(false)
  )
  .addIntegerOption(opt =>
    opt
      .setName('sure')
      .setDescription('Geçici yasak süresi (saat, boş = kalıcı)')
      .setMinValue(1)
      .setMaxValue(8760) // 1 yıl
      .setRequired(false)
  )
  .addIntegerOption(opt =>
    opt
      .setName('mesaj_sil')
      .setDescription('Son kaç günün mesajları silinsin? (0-7)')
      .setMinValue(0)
      .setMaxValue(7)
      .setRequired(false)
  );

// ─── Yardımcılar ─────────────────────────────────────────────
function sureMetni(saat) {
  if (!saat) return '♾️ Kalıcı';
  if (saat < 24) return `⏱️ ${saat} saat`;
  const gun = Math.floor(saat / 24);
  const kalanSaat = saat % 24;
  return kalanSaat > 0 ? `⏱️ ${gun} gün ${kalanSaat} saat` : `⏱️ ${gun} gün`;
}

async function dmGonder(hedefUser, sunucuAdi, sebep, sureSaat) {
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('🔨 Sunucudan Yasaklandınız')
      .setDescription(
        `**${sunucuAdi}** sunucusundan yasaklandınız.\n\n` +
        `**Sebep:** ${sebep}\n` +
        `**Süre:** ${sureMetni(sureSaat)}`
      )
      .setColor(RENKLER.HATA)
      .setTimestamp();
    await hedefUser.send({ embeds: [dmEmbed] });
    return true;
  } catch {
    return false; // DM kapalıysa sessizce geç
  }
}

module.exports = {
  isim: 'ban',
  aciklama: 'Bir kullanıcıyı sunucudan yasaklar.',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (!yetkiliMi(mesaj.member)) return yetkiRed(mesaj, true);

    // Hedef: etiket veya ID (sunucuda olmayan kullanıcı da ID ile banlanabilir)
    const hedefId = mesaj.mentions.users.first()?.id || (/^\d{17,20}$/.test(args[0] || '') ? args[0] : null);
    if (!hedefId) {
      return mesaj.reply('❌ Kullanım: `v!ban @kullanıcı|ID [süre: 12h, 7d] [sebep]`');
    }
    const hedefUser = await client.users.fetch(hedefId).catch(() => null);
    if (!hedefUser) return mesaj.reply('❌ Kullanıcı bulunamadı.');

    if (hedefUser.id === mesaj.author.id) {
      return mesaj.reply('❌ Kendinizi yasaklayamazsınız.');
    }
    if (hedefUser.id === client.user.id) {
      return mesaj.reply('❌ Beni yasaklayamazsınız!');
    }
    const hedef = await mesaj.guild.members.fetch(hedefUser.id).catch(() => null);
    if (hedef) {
      if (!hedef.bannable) {
        return mesaj.reply('❌ Bu kullanıcıyı yasaklayamıyorum (yetkim yetersiz veya kullanıcı benden üst roldedir).');
      }
      if (mesaj.guild.ownerId !== mesaj.author.id &&
          hedef.roles.highest.position >= mesaj.member.roles.highest.position) {
        return mesaj.reply('❌ Bu kullanıcının rolü sizinkiyle eşit veya daha yüksek, yasaklayamazsınız.');
      }
    }

    const sureSaat = sureSaatCoz(args[1]);
    const sebep = args.slice(sureSaat ? 2 : 1).join(' ') || 'Sebep belirtilmedi';
    const dmGitti = hedef ? await dmGonder(hedefUser, mesaj.guild.name, sebep, sureSaat) : false;

    try {
      await mesaj.guild.members.ban(hedefUser.id, { reason: `${mesaj.author.tag}: ${sebep}`, deleteMessageSeconds: 0 });
    } catch (err) {
      return mesaj.reply(`❌ Ban uygulanamadı: ${err.message}`);
    }

    if (sureSaat) {
      await geciciBanEkle(client, {
        guildId: mesaj.guild.id,
        userId: hedefUser.id,
        userTag: hedefUser.tag,
        sureMs: sureSaat * 3600 * 1000,
        sebep,
      }).catch(err => console.error('[BAN] Geçici ban kaydedilemedi:', err.message));
    }

    const embed = new EmbedBuilder()
      .setTitle('🔨 Kullanıcı Yasaklandı')
      .addFields(
        { name: '👤 Kullanıcı', value: `${hedefUser.tag} (<@${hedefUser.id}>)`, inline: true },
        { name: '⚖️ Yetkili', value: mesaj.author.tag, inline: true },
        { name: '⏱️ Süre', value: sureMetni(sureSaat), inline: true },
        { name: '📋 Sebep', value: sebep.slice(0, 1024) },
        { name: '📬 DM Bildirimi', value: dmGitti ? '✅ Gönderildi' : '❌ Gönderilemedi', inline: true },
      )
      .setColor(RENKLER.HATA)
      .setTimestamp()
      .setFooter({ text: `ID: ${hedefUser.id}` });

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔨 Ban — Kullanıcı Yasaklandı',
      `**Kullanıcı:** ${hedefUser.tag} (\`${hedefUser.id}\`)\n**Yetkili:** ${mesaj.author.tag}\n**Sebep:** ${sebep}\n**Süre:** ${sureMetni(sureSaat)}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    await interaction.deferReply();

    const hedefUser = interaction.options.getUser('hedef');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const sureSaat = interaction.options.getInteger('sure') || null;
    const mesajSilGun = interaction.options.getInteger('mesaj_sil') ?? 0;

    // Self-ban kontrolü
    if (hedefUser.id === interaction.user.id) {
      return interaction.editReply({ content: '❌ Kendinizi yasaklayamazsınız.' });
    }
    if (hedefUser.id === client.user.id) {
      return interaction.editReply({ content: '❌ Beni yasaklayamazsınız!' });
    }

    const hedefMember = await interaction.guild.members.fetch(hedefUser.id).catch(() => null);
    if (hedefMember) {
      if (!hedefMember.bannable) {
        return interaction.editReply({ content: '❌ Bu kullanıcıyı yasaklayamıyorum (yetkim yetersiz veya üst rolde).' });
      }
      if (interaction.guild.ownerId !== interaction.user.id &&
          hedefMember.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.editReply({ content: '❌ Bu kullanıcının rolü sizinkiyle eşit veya daha yüksek, yasaklayamazsınız.' });
      }
    }

    // DM önce gönder (ban edilmeden önce)
    const hedefUserObj = hedefMember ? hedefMember.user : hedefUser;
    const dmGitti = await dmGonder(hedefUserObj, interaction.guild.name, sebep, sureSaat);

    // Ban uygula
    try {
      await interaction.guild.members.ban(hedefUser.id, {
        reason: `${interaction.user.tag}: ${sebep}`,
        deleteMessageSeconds: mesajSilGun * 86400,
      });
    } catch (err) {
      return interaction.editReply({ content: `❌ Ban uygulanamadı: ${err.message}` });
    }

    // Geçici ban: veritabanına kaydedilir → bot yeniden başlasa da süre dolunca kalkar
    if (sureSaat) {
      await geciciBanEkle(client, {
        guildId: interaction.guild.id,
        userId: hedefUser.id,
        userTag: hedefUser.tag,
        sureMs: sureSaat * 3600 * 1000,
        sebep,
      }).catch(err => console.error('[BAN] Geçici ban kaydedilemedi:', err.message));
    }

    const embed = new EmbedBuilder()
      .setTitle('🔨 Kullanıcı Yasaklandı')
      .setThumbnail(hedefUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Kullanıcı', value: `${hedefUser.tag} (<@${hedefUser.id}>)`, inline: true },
        { name: '⚖️ Yetkili', value: interaction.user.tag, inline: true },
        { name: '⏱️ Süre', value: sureMetni(sureSaat), inline: true },
        { name: '📋 Sebep', value: sebep.slice(0, 1024) },
        { name: '🗑️ Silinen Mesajlar', value: mesajSilGun > 0 ? `Son ${mesajSilGun} günün mesajları` : 'Silinmedi', inline: true },
        { name: '📬 DM Bildirimi', value: dmGitti ? '✅ Gönderildi' : '❌ DM kapalı', inline: true },
      )
      .setColor(RENKLER.HATA)
      .setTimestamp()
      .setFooter({ text: `ID: ${hedefUser.id}` });

    await interaction.editReply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔨 Ban — Kullanıcı Yasaklandı',
      `**Kullanıcı:** ${hedefUser.tag} (\`${hedefUser.id}\`)\n**Yetkili:** ${interaction.user.tag}\n**Sebep:** ${sebep}\n**Süre:** ${sureMetni(sureSaat)}\n**Silinen Mesaj:** ${mesajSilGun} gün`,
      RENKLER.HATA,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
