// ==========================================
//  VirBot — v!nuke / /nuke Komutu
//  Kanalı kopyalayıp eskisini siler (tüm mesajlar gider).
//  • Onay butonu ile yanlışlıkla silme önlenir
//  • Kanala bağlı bot ayarları (log, AI, XP, RSS, honeypot...) yeni kanala taşınır
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');
const { kanalIdTasi } = require('../../modules/data/dataManager');
const { honeypotEkle } = require('../../modules/security/honeypotManager');

const slashData = new SlashCommandBuilder()
  .setName('nuke')
  .setDescription('Mevcut kanalı tamamen sıfırlayıp baştan oluşturur (tüm mesajlar silinir).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

function onayButonlari(devreDisi = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('nuke_onay').setLabel('💣 Evet, sıfırla').setStyle(ButtonStyle.Danger).setDisabled(devreDisi),
    new ButtonBuilder().setCustomId('nuke_iptal').setLabel('İptal').setStyle(ButtonStyle.Secondary).setDisabled(devreDisi),
  )];
}

/**
 * Onay alındıktan sonra kanalı sıfırlar.
 */
async function kanaliSifirla(client, kanal, yetkiliUser) {
  const pozisyon = kanal.position;
  const yeniKanal = await kanal.clone({ reason: `VirBot — Nuke komutu (${yetkiliUser.tag})` });
  await yeniKanal.setPosition(pozisyon).catch(() => {});

  // Ayarları yeni kanala taşı (silmeden önce: log kanalıysa log yeni kanala gider)
  const tasinan = await kanalIdTasi(kanal.guild.id, kanal.id, yeniKanal.id).catch(() => []);
  if (tasinan.includes('honeypotKanalId')) honeypotEkle(yeniKanal.id, kanal.guild.id);

  await kanal.delete(`VirBot — Nuke komutu (${yetkiliUser.tag})`);

  const embed = new EmbedBuilder()
    .setColor(RENKLER.BASARI)
    .setTitle('💣 Kanal Sıfırlandı (Nuke)')
    .setDescription(
      `Bu kanal <@${yetkiliUser.id}> tarafından başarıyla sıfırlandı!` +
      (tasinan.length ? `\n\n🔁 Bu kanala bağlı **${tasinan.length}** bot ayarı yeni kanala taşındı.` : '')
    )
    .setImage('https://media.giphy.com/media/oe33xf3B5bWSY/giphy.gif')
    .setTimestamp();
  await yeniKanal.send({ embeds: [embed] }).catch(() => {});

  const logEmb = logEmbed(
    '💣 Kanal Sıfırlandı (Nuke)',
    `**Kanal:** <#${yeniKanal.id}> (\`#${yeniKanal.name}\`)\n**Yetkili:** ${yetkiliUser.tag}` +
    (tasinan.length ? `\n**Taşınan Ayarlar:** ${tasinan.map(a => `\`${a}\``).join(', ')}` : ''),
    RENKLER.HATA,
  );
  await logGonder(client, kanal.guild.id, logEmb);
}

/**
 * Onay mesajını gösterir ve butonu bekler.
 */
async function onayIste(client, kanal, yetkiliUser, mesajGonder) {
  const onayMesaji = await mesajGonder({
    content: `⚠️ **#${kanal.name}** kanalındaki **TÜM mesajlar kalıcı olarak silinecek.** Emin misin? (15 sn)`,
    components: onayButonlari(),
  });
  if (!onayMesaji) return;

  try {
    const secim = await onayMesaji.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 15_000,
      filter: (i) => i.user.id === yetkiliUser.id,
    });

    if (secim.customId === 'nuke_iptal') {
      return secim.update({ content: '✅ Nuke işlemi iptal edildi.', components: onayButonlari(true) });
    }

    await secim.update({ content: '💣 Kanal sıfırlanıyor...', components: onayButonlari(true) });
    await kanaliSifirla(client, kanal, yetkiliUser);
  } catch (err) {
    if (err?.code === 'InteractionCollectorError' || /time/i.test(err?.message || '')) {
      await onayMesaji.edit({ content: '⌛ Süre doldu, nuke işlemi iptal edildi.', components: onayButonlari(true) }).catch(() => {});
    } else {
      console.error('[NUKE] Hata:', err?.message || err);
      await onayMesaji.edit({ content: `❌ Kanal sıfırlanamadı: ${err?.message || 'bilinmeyen hata'}`, components: [] }).catch(() => {});
    }
  }
}

module.exports = {
  isim: 'nuke',
  aciklama: 'Kanalı kopyalayarak tüm mesajları temizler ve sıfırlar (onaylı).',
  adminGerekli: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj) {
    if (!mesaj.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return mesaj.reply('❌ Bu komutu kullanmak için `Kanalları Yönet` yetkisine sahip olmalısınız.');
    }
    if (!mesaj.channel.deletable) {
      return mesaj.reply('❌ Bu kanalı silme yetkim yok (veya kanal sistem kanalı).');
    }
    await onayIste(client, mesaj.channel, mesaj.author, (secenek) => mesaj.reply(secenek).catch(() => null));
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }
    if (!interaction.channel?.deletable) {
      return interaction.reply({ content: '❌ Bu kanalı silme yetkim yok (veya kanal sistem kanalı).', ephemeral: true });
    }
    await onayIste(client, interaction.channel, interaction.user, async (secenek) => {
      await interaction.reply({ ...secenek, ephemeral: true });
      return interaction.fetchReply();
    });
  },
};
