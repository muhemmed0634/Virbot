// ==========================================
//  VirBot — v!cekilis-baslat / /cekilis-baslat (Beta)
// ==========================================
'use strict';

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { cekilisBaslat, sureyiCevir } = require('../../modules/giveaway/giveawayManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('cekilis-baslat')
  .setDescription('Sadeleştirilmiş Beta çekilişi başlatır.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(opt =>
    opt
      .setName('sure')
      .setDescription('Çekiliş süresi (örn: 10m, 1h, 1d)')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt
      .setName('kazanan')
      .setDescription('Kazanan kişi sayısı (en az 1)')
      .setMinValue(1)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('odul')
      .setDescription('Verilecek ödül (örn: Discord Nitro, VIP Rolü)')
      .setRequired(true)
  );

module.exports = {
  isim: 'cekilis-baslat',
  aciklama: 'Sadeleştirilmiş çekiliş başlatır. Örnek: v!cekilis-baslat 10m 1 Discord Nitro',
  alternatifler: ['cekilis', 'giveaway', 'cekilisbaslat'],
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (args.length < 3) {
      return mesaj.reply(
        '❌ Kullanım: `v!cekilis-baslat <Süre: 10m|1h|1d> <KazananSayısı> <Ödül>`\n' +
        'Örnek: `v!cekilis-baslat 30m 1 Discord Nitro` (veya slash: `/cekilis-baslat`)'
      );
    }

    const sureMs = sureyiCevir(args[0]);
    if (!sureMs) {
      return mesaj.reply('❌ Geçersiz süre formatı! Örnekler: `30s`, `10m`, `2h`, `1d`');
    }

    const kazananSayisi = parseInt(args[1], 10);
    if (isNaN(kazananSayisi) || kazananSayisi < 1) {
      return mesaj.reply('❌ Geçersiz kazanan sayısı! En az 1 olmalıdır.');
    }

    const odul = args.slice(2).join(' ').trim();
    if (!odul) {
      return mesaj.reply('❌ Lütfen verilecek ödülü belirtin!');
    }

    await mesaj.delete().catch(() => {});

    await cekilisBaslat(client, {
      kanalId: mesaj.channel.id,
      guildId: mesaj.guild.id,
      odul,
      kazananSayisi,
      sureMs,
      baslatanId: mesaj.author.id,
    });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const sureMetin = interaction.options.getString('sure').trim();
    const kazananSayisi = interaction.options.getInteger('kazanan');
    const odul = interaction.options.getString('odul').trim();

    const sureMs = sureyiCevir(sureMetin);
    if (!sureMs) {
      return interaction.reply({
        content: '❌ Geçersiz süre formatı! Örnek formatlar: `10m`, `1h`, `2d`, `30s`',
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: '✅ Çekiliş başarıyla başlatılıyor...',
      ephemeral: true,
    });

    await cekilisBaslat(client, {
      kanalId: interaction.channelId,
      guildId: interaction.guildId,
      odul,
      kazananSayisi,
      sureMs,
      baslatanId: interaction.user.id,
    });
  },
};
