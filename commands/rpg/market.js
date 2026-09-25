// ==========================================
//  VirBot — v!market / /market Komutu
//  Silah & Zırh Ekipman Mağazası (Min 500 Coin)
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { SILAHLAR, ZIRHLAR, esyaSatinAl } = require('../../modules/rpg/rpgManager');
const { kullaniciGetir } = require('../../modules/data/dataManager');

const slashData = new SlashCommandBuilder()
  .setName('market')
  .setDescription('RPG silah ve zırh mağazasını görüntüler veya eşya satın alır.')
  .addStringOption(opt =>
    opt
      .setName('satin-al')
      .setDescription('Satın almak istediğiniz eşyanın kodu (örn: pasli_kilic, deri_zirh)')
      .setRequired(false)
      .addChoices(
        ...SILAHLAR.map(s => ({ name: `${s.isim} (+${s.guc} Güç) - ${s.fiyat} Coin`, value: s.id })),
        ...ZIRHLAR.map(z => ({ name: `${z.isim} (+${z.guc} Güç) - ${z.fiyat} Coin`, value: z.id }))
      )
  );

function marketEmbedOlustur(bakiye) {
  const silahListesi = SILAHLAR.map(
    s => `• **${s.isim}** (\`${s.id}\`)\n  └ Güç: **+${s.guc}** | Fiyat: **${s.fiyat} 🪙**`
  ).join('\n');

  const zirhListesi = ZIRHLAR.map(
    z => `• **${z.isim}** (\`${z.id}\`)\n  └ Güç: **+${z.guc}** | Fiyat: **${z.fiyat} 🪙**`
  ).join('\n');

  return new EmbedBuilder()
    .setTitle('🛒 VirBot RPG Ekipman Mağazası')
    .setDescription(
      `Mevcut Bakiyeniz: **${bakiye} 🪙**\n\n` +
      `Satın almak için: \`/market satin-al:[eşya_kodu]\` veya \`v!market satin-al <eşya_kodu>\`\n\n` +
      `### ⚔️ Silahlar\n${silahListesi}\n\n` +
      `### 🛡️ Zırhlar\n${zirhListesi}`
    )
    .setColor(RENKLER.RPG || 0xFFAA00)
    .setFooter({ text: 'VirBot RPG • Tüm eşyalar minimum 500 coindir.' })
    .setTimestamp();
}

module.exports = {
  isim: 'market',
  aciklama: 'RPG silah ve zırh mağazasını açar veya eşya satın alır.',
  alternatifler: ['shop', 'magaza', 'dukkan'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const islem = args[0]?.toLowerCase();
    const esyaId = args[1]?.toLowerCase();

    if (islem === 'satin-al' || islem === 'al' || islem === 'buy') {
      if (!esyaId) {
        return mesaj.reply('❌ Lütfen satın almak istediğiniz eşyanın kodunu girin! Örnek: `v!market satin-al pasli_kilic`');
      }

      const sonuc = await esyaSatinAl(mesaj.author.id, mesaj.guild.id, esyaId);
      if (sonuc.hata) return mesaj.reply(sonuc.hata);

      const embed = new EmbedBuilder()
        .setTitle('🎉 Satın Alma Başarılı!')
        .setDescription(
          `Tebrikler! **${sonuc.esya.isim}** satın aldınız ve otomatik olarak kuşandınız.\n\n` +
          `• **Tür:** ${sonuc.esya.tip === 'silah' ? '⚔️ Silah' : '🛡️ Zırh'}\n` +
          `• **Sağlanan Güç:** +${sonuc.esya.guc}\n` +
          `• **Ödenen:** ${sonuc.esya.fiyat} 🪙\n` +
          `• **Kalan Bakiye:** ${sonuc.kalanCoin} 🪙`
        )
        .setColor(RENKLER.BASARI)
        .setTimestamp();

      return mesaj.reply({ embeds: [embed] });
    }

    const kullanici = await kullaniciGetir(mesaj.author.id, mesaj.guild.id);
    const embed = marketEmbedOlustur(kullanici.coins);
    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const esyaId = interaction.options.getString('satin-al');

    if (esyaId) {
      const sonuc = await esyaSatinAl(interaction.user.id, interaction.guildId, esyaId);
      if (sonuc.hata) {
        return interaction.reply({ content: sonuc.hata, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎉 Satın Alma Başarılı!')
        .setDescription(
          `Tebrikler! **${sonuc.esya.isim}** satın aldınız ve otomatik olarak kuşandınız.\n\n` +
          `• **Tür:** ${sonuc.esya.tip === 'silah' ? '⚔️ Silah' : '🛡️ Zırh'}\n` +
          `• **Sağlanan Güç:** +${sonuc.esya.guc}\n` +
          `• **Ödenen:** ${sonuc.esya.fiyat} 🪙\n` +
          `• **Kalan Bakiye:** ${sonuc.kalanCoin} 🪙`
        )
        .setColor(RENKLER.BASARI)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const kullanici = await kullaniciGetir(interaction.user.id, interaction.guildId);
    const embed = marketEmbedOlustur(kullanici.coins);
    await interaction.reply({ embeds: [embed] });
  },
};
