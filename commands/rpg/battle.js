// ==========================================
//  VirBot v6 — v!battle / /battle Komutu
//  PvP Savaş Sistemi — Ekipman + Bahis
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { RENKLER, COLLECTOR_ZAMAN } = require('../../config/config');
const {
  meydanOku,
  meydanKabul,
  meydanReddet,
  MIN_BAHIS,
  MAKS_BAHIS,
} = require('../../modules/rpg/battleManager');

// ─── Slash Command Tanımı ─────────────────────────────────
const slashData = new SlashCommandBuilder()
  .setName('battle')
  .setDescription('⚔️ Başka bir oyuncuya coin için meydan okur!')
  .addSubcommand(sub =>
    sub
      .setName('meydan')
      .setDescription('Bir kullanıcıya meydan oku')
      .addUserOption(opt =>
        opt.setName('rakip').setDescription('Meydan okuyacağın kullanıcı').setRequired(true)
      )
      .addIntegerOption(opt =>
        opt
          .setName('bahis')
          .setDescription(`Bahis miktarı (${MIN_BAHIS}–${MAKS_BAHIS} coin veya bakiyenin %30'u)`)
          .setMinValue(MIN_BAHIS)
          .setMaxValue(MAKS_BAHIS)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('kabul')
      .setDescription('Gelen meydan okumayı kabul et')
      .addUserOption(opt =>
        opt.setName('challenger').setDescription('Meydan okuyan kullanıcı').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('reddet')
      .setDescription('Gelen meydan okumayı reddet')
      .addUserOption(opt =>
        opt.setName('challenger').setDescription('Meydan okuyan kullanıcı').setRequired(true)
      )
  );

// ─── Raund Satırı Oluştur ─────────────────────────────────
function raundMetni(r, isim1, isim2) {
  const k1 = r.kritik1 ? ' ⚡KRİTİK!' : '';
  const k2 = r.kritik2 ? ' ⚡KRİTİK!' : '';
  return (
    `**Raund ${r.raund}**\n` +
    `🗡️ ${isim1}: **${r.hasar1}** hasar${k1} → ${isim2} HP: **${r.hp2}**\n` +
    `🗡️ ${isim2}: **${r.hasar2}** hasar${k2} → ${isim1} HP: **${r.hp1}**`
  );
}

// ─── Ekipman Bilgi Satırı ─────────────────────────────────
function ekipmanSatiri(kullanici, isim) {
  const silah = kullanici.silah ? `${kullanici.silah.isim} (+${kullanici.silah.guc})` : '_(yok)_';
  const zirh  = kullanici.zirh  ? `${kullanici.zirh.isim} (+${kullanici.zirh.guc})`  : '_(yok)_';
  return `**${isim}** — ⚔️ ${silah} | 🛡️ ${zirh}`;
}

// ─── Sonuç Embed Oluştur ──────────────────────────────────
function sonucEmbed(sonuc, challenger, hedef) {
  const challIsim = challenger.displayName || challenger.username;
  const hedefIsim = hedef.displayName     || hedef.username;
  const kazananUser = sonuc.kazananId === challenger.id ? challenger : hedef;
  const kazananIsim = kazananUser.displayName || kazananUser.username;

  // Son 3 raundun özeti (çok uzun olmasın)
  const raundOzeti = sonuc.raunlar
    .slice(-3)
    .map(r => raundMetni(r, challIsim, hedefIsim))
    .join('\n\n');

  return new EmbedBuilder()
    .setTitle('⚔️ Battle Sonucu!')
    .setThumbnail(kazananUser.displayAvatarURL({ size: 64 }))
    .setColor(RENKLER.RPG)
    .setDescription(
      `### 🏆 ${kazananIsim} kazandı!\n\n` +
      `${ekipmanSatiri(sonuc.challUser, challIsim)}\n` +
      `${ekipmanSatiri(sonuc.hedefUser, hedefIsim)}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📜 **Son Raunlar:**\n${raundOzeti}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `❤️ Kazanan HP: **${sonuc.kazananHP}**\n` +
      `💀 Kaybeden HP: **${sonuc.kaybedenHP}**\n\n` +
      `🪙 **Pot:** ${sonuc.pot} coin\n` +
      `🏆 **Kazanan Bakiye:** ${sonuc.kazananYeniBakiye} 🪙`
    )
    .setFooter({ text: 'VirBot RPG • /market ile ekipman al, savaşlarda üstün gel!' })
    .setTimestamp();
}

// ─── Prefix: Meydan Okuma (v!battle @kullanıcı bahis) ────
async function prefixMeydan(client, mesaj, args) {
  const hedefUye = mesaj.mentions.members.first();
  if (!hedefUye) {
    return mesaj.reply(
      '❌ Kullanım: `v!battle @kullanıcı <bahis>`\n' +
      'Örnek: `v!battle @Ahmet 200`\n\n' +
      '**Kabul etmek için:** `v!battlekabul @meydan_okuyan`\n' +
      '**Reddetmek için:** `v!battlereddet @meydan_okuyan`'
    );
  }
  if (hedefUye.user.bot) return mesaj.reply('❌ Botlara meydan okuyamazsın!');

  const bahis = parseInt(args[1]);
  const sonuc = await meydanOku(mesaj.author.id, hedefUye.id, mesaj.guild.id, bahis);
  if (sonuc.hata) return mesaj.reply(sonuc.hata);

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Meydan Okuma!')
    .setColor(RENKLER.UYARI)
    .setDescription(
      `<@${mesaj.author.id}> seni **${bahis} 🪙** için savaşa çağırıyor, <@${hedefUye.id}>!\n\n` +
      `**Kabul etmek için:** \`v!battlekabul @${mesaj.author.username}\`\n` +
      `**Reddetmek için:** \`v!battlereddet @${mesaj.author.username}\`\n\n` +
      `⏳ **${sonuc.kabul_suresi} saniye** içinde cevap verilmezse iptal olur.`
    )
    .setFooter({ text: 'VirBot RPG • Battle Sistemi' })
    .setTimestamp();

  await mesaj.reply({ embeds: [embed] });
}

// ─── Prefix: Meydan Okuma Kabul (v!battlekabul @challenger) ──
async function prefixKabul(client, mesaj, args) {
  const challUye = mesaj.mentions.members.first();
  if (!challUye) {
    return mesaj.reply('❌ Kullanım: `v!battlekabul @meydan_okuyan`');
  }

  const sonuc = await meydanKabul(challUye.id, mesaj.author.id, mesaj.guild.id);
  if (sonuc.hata) return mesaj.reply(sonuc.hata);

  await mesaj.reply({
    embeds: [sonucEmbed(sonuc.sonuc, challUye.user, mesaj.author)],
  });
}

// ─── Prefix: Meydan Okuma Reddet (v!battlereddet @challenger) ─
async function prefixReddet(client, mesaj, args) {
  const challUye = mesaj.mentions.members.first();
  if (!challUye) return mesaj.reply('❌ Kullanım: `v!battlereddet @meydan_okuyan`');

  const iptal = meydanReddet(challUye.id, mesaj.author.id, mesaj.guild.id);
  if (!iptal) return mesaj.reply('❌ Sana yönelik bekleyen bir meydan okuma bulunamadı.');

  await mesaj.reply(`🚫 <@${mesaj.author.id}>, <@${challUye.id}>'nin meydan okumasını reddetti.`);
}

// ─── Slash: Meydan Komutu ─────────────────────────────────
async function slashMeydan(client, interaction) {
  const hedef = interaction.options.getUser('rakip');
  const bahis = interaction.options.getInteger('bahis');

  if (hedef.bot) {
    return interaction.reply({ content: '❌ Botlara meydan okuyamazsın!', ephemeral: true });
  }

  const sonuc = await meydanOku(interaction.user.id, hedef.id, interaction.guildId, bahis);
  if (sonuc.hata) {
    return interaction.reply({ content: sonuc.hata, ephemeral: true });
  }

  // Kabul / Reddet butonları
  const kabul  = new ButtonBuilder()
    .setCustomId(`battle_kabul_${interaction.user.id}`)
    .setLabel('⚔️ Kabul Et')
    .setStyle(ButtonStyle.Success);

  const reddet = new ButtonBuilder()
    .setCustomId(`battle_reddet_${interaction.user.id}`)
    .setLabel('🚫 Reddet')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(kabul, reddet);

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Meydan Okuma!')
    .setColor(RENKLER.UYARI)
    .setThumbnail(interaction.user.displayAvatarURL({ size: 64 }))
    .setDescription(
      `<@${interaction.user.id}> seni **${bahis} 🪙** için savaşa çağırıyor, <@${hedef.id}>!\n\n` +
      `Aşağıdaki butonlardan birini tıkla.\n` +
      `⏳ **${sonuc.kabul_suresi} saniye** içinde cevap verilmezse iptal olur.`
    )
    .setFooter({ text: 'VirBot RPG • Battle Sistemi' })
    .setTimestamp();

  await interaction.reply({
    content: `<@${hedef.id}>`,
    embeds: [embed],
    components: [row],
  });

  // Sadece hedef kullanıcı butona basabilir
  const mesaj = await interaction.fetchReply();
  const collector = mesaj.createMessageComponentCollector({
    filter: (btn) => btn.user.id === hedef.id,
    time: sonuc.kabul_suresi * 1000,
    max: 1,
  });

  collector.on('collect', async (btn) => {
    await btn.deferUpdate();

    if (btn.customId === `battle_kabul_${interaction.user.id}`) {
      const battleSonuc = await meydanKabul(interaction.user.id, hedef.id, interaction.guildId);
      if (battleSonuc.hata) {
        return interaction.editReply({ content: battleSonuc.hata, components: [], embeds: [] });
      }
      await interaction.editReply({
        content: '',
        embeds: [sonucEmbed(battleSonuc.sonuc, interaction.user, hedef)],
        components: [],
      });
    } else {
      meydanReddet(interaction.user.id, hedef.id, interaction.guildId);
      await interaction.editReply({
        content: `🚫 <@${hedef.id}>, <@${interaction.user.id}>'nin meydan okumasını reddetti.`,
        embeds: [],
        components: [],
      });
    }
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      // Süre doldu, temizle
      meydanReddet(interaction.user.id, hedef.id, interaction.guildId);
      interaction.editReply({
        content: `⏰ <@${hedef.id}> cevap vermedi. Meydan okuma iptal edildi.`,
        embeds: [],
        components: [],
      }).catch(() => {});
    }
  });
}

// ─── Slash: Kabul / Reddet ────────────────────────────────
async function slashKabul(client, interaction) {
  const challenger = interaction.options.getUser('challenger');
  const sonuc = await meydanKabul(challenger.id, interaction.user.id, interaction.guildId);
  if (sonuc.hata) return interaction.reply({ content: sonuc.hata, ephemeral: true });

  await interaction.reply({
    embeds: [sonucEmbed(sonuc.sonuc, challenger, interaction.user)],
  });
}

async function slashReddet(client, interaction) {
  const challenger = interaction.options.getUser('challenger');
  const iptal = meydanReddet(challenger.id, interaction.user.id, interaction.guildId);
  if (!iptal) {
    return interaction.reply({ content: '❌ Sana yönelik bekleyen bir meydan okuma bulunamadı.', ephemeral: true });
  }
  await interaction.reply(`🚫 <@${interaction.user.id}>, <@${challenger.id}>'nin meydan okumasını reddetti.`);
}

// ─── Export ───────────────────────────────────────────────
module.exports = {
  isim: 'battle',
  aciklama: '⚔️ Başka bir oyuncuya coin için PvP meydan okur.',
  alternatifler: ['savas', 'pvp'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix ──────────────────────────────────────────────
  async calistir(client, mesaj, args) {
    // v!battle @user bahis  → meydan oku
    // v!battlekabul / v!battlereddet → ayrı komutlar olarak da kayıtlı
    return prefixMeydan(client, mesaj, args);
  },

  // ─── Slash ───────────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const alt = interaction.options.getSubcommand();
    if (alt === 'meydan')  return slashMeydan(client, interaction);
    if (alt === 'kabul')   return slashKabul(client, interaction);
    if (alt === 'reddet')  return slashReddet(client, interaction);
  },
};
