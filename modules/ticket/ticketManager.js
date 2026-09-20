// ==========================================
//  VirBot — Ticket Yöneticisi
//  Kanal açma, kapama ve transcript
// ==========================================

const {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');
const { RENKLER, TICKET_KANAL_ADI } = require('../../config/config');
const { ticketGetir, ticketKaydet, ticketSil } = require('../data/dataManager');
const { logGonder, logEmbed } = require('../logger/logManager');

// ─── Ticket Aç ─────────────────────────────────────────────
async function ticketAc(interaction) {
  const guild = interaction.guild;
  const uye = interaction.member;

  // Zaten açık ticket var mı?
  const mevcutTicketlar = guild.channels.cache.filter(
    k => k.name === TICKET_KANAL_ADI(uye.user.username)
  );
  if (mevcutTicketlar.size > 0) {
    return interaction.reply({
      content: `❌ Zaten açık bir destek talebiniz var: ${mevcutTicketlar.first()}`,
      ephemeral: true,
    });
  }

  try {
    // Admin rolü izinleri
    const adminRolu = guild.roles.cache.find(r => r.permissions.has(PermissionFlagsBits.Administrator));

    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: uye.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    if (adminRolu) {
      permissionOverwrites.push({
        id: adminRolu.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      });
    }

    const kanalAdi = TICKET_KANAL_ADI(uye.user.username);
    const yeniKanal = await guild.channels.create({
      name: kanalAdi,
      type: 0, // GuildText
      permissionOverwrites,
      topic: `${uye.user.tag} tarafından açılan destek talebi`,
    });

    ticketKaydet(yeniKanal.id, {
      kanalId: yeniKanal.id,
      guildId: guild.id,
      sahipId: uye.id,
      sahipTag: uye.user.tag,
      acilisTarihi: Date.now(),
    });

    // Kanal içi embed
    const embed = new EmbedBuilder()
      .setTitle('🎫 Destek Talebi')
      .setDescription(
        `Merhaba ${uye}! Destek talebiniz oluşturuldu.\n\nSorunuzu veya talebinizi buraya yazabilirsiniz. Ekibimiz en kısa sürede yanıt verecek.\n\n🔒 Talebi kapatmak için aşağıdaki düğmeye tıklayın.`
      )
      .setColor(RENKLER.TICKET)
      .setTimestamp()
      .setFooter({ text: 'VirBot Destek Sistemi' });

    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_kapat_${yeniKanal.id}`)
        .setLabel('🔒 Bileti Kapat')
        .setStyle(ButtonStyle.Danger),
    );

    await yeniKanal.send({
      content: `${uye} — Destek talebiniz açıldı!`,
      embeds: [embed],
      components: [butonlar],
    });

    await interaction.reply({
      content: `✅ Destek talebiniz oluşturuldu: ${yeniKanal}`,
      ephemeral: true,
    });

    // Log
    const logEmb = logEmbed(
      'Ticket Açıldı',
      `**Kullanıcı:** ${uye.user.tag} (<@${uye.id}>)\n**Kanal:** ${yeniKanal}`,
      RENKLER.TICKET,
    );
    await logGonder(interaction.client, guild.id, logEmb);

  } catch (hata) {
    console.error('[TİCKET] Açma hatası:', hata.message);
    await interaction.reply({
      content: '❌ Ticket açılırken bir hata oluştu. Yetki kontrolü yapın.',
      ephemeral: true,
    });
  }
}

// ─── Ticket Kapat ──────────────────────────────────────────
async function ticketKapat(interaction, kanalId) {
  const ticketVeri = ticketGetir(kanalId);
  if (!ticketVeri) {
    return interaction.reply({ content: '❌ Bu kanal bir ticket değil.', ephemeral: true });
  }

  await interaction.reply({ content: '🔒 Ticket kapatılıyor, transcript hazırlanıyor...', ephemeral: true });

  try {
    const kanal = interaction.channel;
    const mesajlar = await kanal.messages.fetch({ limit: 100 });

    // Transcript oluştur
    const siraliMesajlar = [...mesajlar.values()].reverse();
    let transcriptMetni = `═══════════════════════════════════\n`;
    transcriptMetni += `🎫 VirBot — Ticket Transcript\n`;
    transcriptMetni += `Kullanıcı : ${ticketVeri.sahipTag}\n`;
    transcriptMetni += `Tarih     : ${new Date(ticketVeri.acilisTarihi).toLocaleString('tr-TR')}\n`;
    transcriptMetni += `Kanal     : #${kanal.name}\n`;
    transcriptMetni += `═══════════════════════════════════\n\n`;

    for (const mesaj of siraliMesajlar) {
      if (mesaj.author.bot) continue;
      const tarih = new Date(mesaj.createdTimestamp).toLocaleString('tr-TR');
      transcriptMetni += `[${tarih}] ${mesaj.author.tag}:\n${mesaj.content}\n`;
      if (mesaj.attachments.size > 0) {
        mesaj.attachments.forEach(ek => {
          transcriptMetni += `  📎 Ek: ${ek.url}\n`;
        });
      }
      transcriptMetni += '\n';
    }

    const dosya = new AttachmentBuilder(
      Buffer.from(transcriptMetni, 'utf8'),
      { name: `transcript-${kanal.name}-${Date.now()}.txt` }
    );

    // Log kanalına gönder
    const { ayarGetir } = require('../data/dataManager');
    const ayarlar = ayarGetir(interaction.guild.id);
    if (ayarlar?.logKanalId) {
      const logKanal = await interaction.client.channels.fetch(ayarlar.logKanalId).catch(() => null);
      if (logKanal) {
        const logEmb = new EmbedBuilder()
          .setTitle('🎫 Ticket Kapatıldı — Transcript')
          .setDescription(
            `**Kullanıcı:** ${ticketVeri.sahipTag} (<@${ticketVeri.sahipId}>)\n**Kapatan:** ${interaction.user.tag}\n**Kanal:** #${kanal.name}`
          )
          .setColor(RENKLER.HATA)
          .setTimestamp()
          .setFooter({ text: 'VirBot Ticket Sistemi' });

        await logKanal.send({ embeds: [logEmb], files: [dosya] });
      }
    }

    ticketSil(kanalId);

    // Kanalı 3 saniye sonra sil
    setTimeout(() => kanal.delete('Ticket kapatıldı').catch(console.error), 3000);

  } catch (hata) {
    console.error('[TİCKET] Kapatma hatası:', hata.message);
  }
}

module.exports = { ticketAc, ticketKapat };
