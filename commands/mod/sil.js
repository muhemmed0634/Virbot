// ==========================================
//  VirBot — v!sil / /sil Komutu
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

const slashData = new SlashCommandBuilder()
  .setName('sil')
  .setDescription('Belirtilen miktarda mesajı kanaldan siler.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption(opt =>
    opt
      .setName('sayi')
      .setDescription('Silinecek mesaj sayısı (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  );

module.exports = {
  isim: 'sil',
  aciklama: 'Belirtilen miktarda mesajı kanaldan siler.',
  alternatifler: ['clear', 'temizle', 'purge'],
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (!mesaj.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return mesaj.reply('❌ Bu komutu kullanmak için `Mesajları Yönet` yetkisine sahip olmalısınız.');
    }

    const sayi = parseInt(args[0], 10);
    if (!sayi || isNaN(sayi) || sayi < 1 || sayi > 100) {
      return mesaj.reply('❌ Lütfen silinecek mesaj sayısını 1 ile 100 arasında belirtin: `v!sil 20`');
    }

    // Komut mesajını da silmeye dahil etmek için +1
    const silinecek = Math.min(sayi + 1, 100);
    const silinenler = await mesaj.channel.bulkDelete(silinecek, true).catch(err => {
      console.error('[SİL] Hata:', err.message);
      return null;
    });

    if (!silinenler) {
      return mesaj.channel.send('❌ 14 günden eski mesajlar Discord tarafından toplu silinemez.').then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const gercekSilinen = Math.max(silinenler.size - 1, 0);
    const bildiri = await mesaj.channel.send(`🧹 **${gercekSilinen}** adet mesaj başarıyla silindi!`);
    setTimeout(() => bildiri.delete().catch(() => {}), 4000);

    const logEmb = logEmbed(
      '🧹 Mesajlar Silindi (Purge)',
      `**Kanal:** <#${mesaj.channel.id}>\n**Yetkili:** ${mesaj.author.tag}\n**Miktar:** ${gercekSilinen} mesaj`,
      RENKLER.BILGI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const sayi = interaction.options.getInteger('sayi');
    const silinenler = await interaction.channel.bulkDelete(sayi, true).catch(err => {
      console.error('[SİL] Slash Hata:', err.message);
      return null;
    });

    if (!silinenler) {
      return interaction.reply({ content: '❌ Mesajlar silinemedi (14 günden eski mesajlar silinemez).', ephemeral: true });
    }

    await interaction.reply({ content: `🧹 **${silinenler.size}** adet mesaj başarıyla silindi!`, ephemeral: true });

    const logEmb = logEmbed(
      '🧹 Mesajlar Silindi (Slash)',
      `**Kanal:** <#${interaction.channel.id}>\n**Yetkili:** ${interaction.user.tag}\n**Miktar:** ${silinenler.size} mesaj`,
      RENKLER.BILGI,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
