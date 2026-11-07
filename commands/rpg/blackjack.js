// ==========================================
//  VirBot v5 — v!blackjack / /blackjack (21)
//  İnteraktif Butonlu Blackjack (Hit, Stand, Double)
// ==========================================
'use strict';

const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGetir, kullaniciGuncelle, coinDegistir } = require('../../modules/data/dataManager');

const BJ_COOLDOWN = 15_000;
const MAX_BAHIS_YUZDE = 0.25;
const MUTLAK_MAX_BAHIS = 5_000;
const bjCooldown = new Map();

const slashData = new SlashCommandBuilder()
  .setName('blackjack')
  .setDescription('🃏 Krupiyeye karşı Blackjack (21) oynar.')
  .addIntegerOption(opt =>
    opt
      .setName('bahis')
      .setDescription('Oynamak istediğiniz coin miktarı')
      .setRequired(true)
      .setMinValue(10)
  );

// ─── Kart Sistemi ─────────────────────────────────────────────
const KART_DESENLERI = ['♠️', '♥️', '♦️', '♣️'];
const KART_DEGERLERI = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function desteOlustur() {
  const deste = [];
  for (const desen of KART_DESENLERI) {
    for (const deger of KART_DEGERLERI) {
      deste.push({ desen, deger });
    }
  }
  // Karıştır (Fisher-Yates)
  for (let i = deste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deste[i], deste[j]] = [deste[j], deste[i]];
  }
  return deste;
}

function elPuaniHesapla(el) {
  let toplam = 0;
  let asSayisi = 0;

  for (const kart of el) {
    if (kart.deger === 'A') {
      asSayisi++;
      toplam += 11;
    } else if (['K', 'Q', 'J'].includes(kart.deger)) {
      toplam += 10;
    } else {
      toplam += parseInt(kart.deger, 10);
    }
  }

  while (toplam > 21 && asSayisi > 0) {
    toplam -= 10;
    asSayisi--;
  }

  return toplam;
}

function elGoster(el, gizle = false) {
  if (gizle) {
    return `\`${el[0].desen} ${el[0].deger}\`  \`🎴 ??\``;
  }
  return el.map(k => `\`${k.desen} ${k.deger}\``).join('  ');
}

function butonlariGetir(doubleYapabilir = false, bitti = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('bj_hit')
      .setLabel('🃏 Kart Çek (Hit)')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(bitti),
    new ButtonBuilder()
      .setCustomId('bj_stand')
      .setLabel('🛑 Kal (Stand)')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(bitti),
  );

  if (doubleYapabilir && !bitti) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('bj_double')
        .setLabel('⚡ İki Katı (Double)')
        .setStyle(ButtonStyle.Success)
        .setDisabled(bitti)
    );
  }

  return [row];
}

async function bjOyna(mesajVeyaInteraction, user, guildId, istenenBahis) {
  const cdKey = `${user.id}-${guildId}`;
  const son = bjCooldown.get(cdKey) || 0;
  const fark = Date.now() - son;
  if (fark < BJ_COOLDOWN) {
    const sn = Math.ceil((BJ_COOLDOWN - fark) / 1000);
    const err = `⏳ Blackjack cooldown! Lütfen **${sn}** saniye bekleyin.`;
    return mesajVeyaInteraction.reply ? mesajVeyaInteraction.reply({ content: err, ephemeral: true }) : null;
  }

  const kullanici = await kullaniciGetir(user.id, guildId);
  const mevcutBakiye = kullanici.coins || 0;

  if (mevcutBakiye < 10) {
    const err = '❌ Blackjack oynamak için en az **10 coin** gerekiyor.';
    return mesajVeyaInteraction.reply ? mesajVeyaInteraction.reply({ content: err, ephemeral: true }) : null;
  }

  const maksBahis = Math.min(Math.floor(mevcutBakiye * MAX_BAHIS_YUZDE), MUTLAK_MAX_BAHIS);
  let bahis = Math.max(10, Math.min(istenenBahis, maksBahis));

  if (istenenBahis > maksBahis) {
    const err = `⚠️ Bakiyenize göre maksimum **${maksBahis.toLocaleString('tr-TR')} coin** (bakiyenin %25'i) yatırabilirsiniz!`;
    return mesajVeyaInteraction.reply ? mesajVeyaInteraction.reply({ content: err, ephemeral: true }) : null;
  }

  // Bahsi baştan atomik olarak düş (bakiye o arada azaldıysa oyun başlamaz)
  bjCooldown.set(cdKey, Date.now());
  const dusuldu = await coinDegistir(user.id, guildId, -bahis);
  if (!dusuldu) {
    bjCooldown.delete(cdKey);
    const err = '❌ Bakiyeniz bu bahis için yetersiz.';
    return mesajVeyaInteraction.reply ? mesajVeyaInteraction.reply({ content: err, ephemeral: true }) : null;
  }

  const deste = desteOlustur();
  const oyuncuEli = [deste.pop(), deste.pop()];
  const krupiyeEli = [deste.pop(), deste.pop()];

  let oyuncuPuani = elPuaniHesapla(oyuncuEli);
  let krupiyePuani = elPuaniHesapla(krupiyeEli);

  // Doğal Blackjack kontrolü (krupiye de 21 ise berabere → bahis iade)
  if (oyuncuPuani === 21) {
    const berabere = krupiyePuani === 21;
    const kazanc = berabere ? bahis : Math.floor(bahis * 2.5); // 3:2 blackjack ödemesi
    const net = kazanc - bahis;
    const guncel = (await coinDegistir(user.id, guildId, kazanc))?.coins ?? 0;

    const embed = new EmbedBuilder()
      .setTitle(berabere ? '🤝 Çifte Blackjack — Berabere!' : '🃏 BLACKJACK! (21)')
      .setColor(berabere ? 0xFEE75C : 0x57F287)
      .setDescription(`${berabere ? 'İkiniz de Blackjack yaptınız, bahsiniz iade edildi.' : 'Tebrikler! İlk dağıtımda **Blackjack** yaptınız!'}\n\n**Sizin Eliniz:** ${elGoster(oyuncuEli)} (\`21\`)\n**Krupiye:** ${elGoster(krupiyeEli)} (\`${krupiyePuani}\`)`)
      .addFields(
        { name: '💰 Bahis', value: `${bahis.toLocaleString('tr-TR')} 🪙`, inline: true },
        { name: '🎉 Net Kazanç', value: `+${net.toLocaleString('tr-TR')} 🪙`, inline: true },
        { name: '💳 Yeni Bakiye', value: `${guncel.toLocaleString('tr-TR')} 🪙`, inline: true },
      )
      .setTimestamp();

    return mesajVeyaInteraction.reply ? mesajVeyaInteraction.reply({ embeds: [embed] }) : null;
  }

  const doubleYapabilir = (mevcutBakiye - bahis) >= bahis;

  const embed = new EmbedBuilder()
    .setTitle(`🃏 Blackjack — ${user.username}`)
    .setColor(RENKLER.RPG || 0xFEE75C)
    .setDescription('Hamlenizi seçin:')
    .addFields(
      { name: `👤 Sizin Eliniz (\`${oyuncuPuani}\`)`, value: elGoster(oyuncuEli), inline: false },
      { name: '🎰 Krupiyenin Eli', value: elGoster(krupiyeEli, true), inline: false },
      { name: '🪙 Bahis', value: `\`${bahis.toLocaleString('tr-TR')} coin\``, inline: true }
    )
    .setFooter({ text: '30 saniye içinde seçim yapmalısınız.' });

  const replyMsg = await (mesajVeyaInteraction.reply
    ? mesajVeyaInteraction.reply({ embeds: [embed], components: butonlariGetir(doubleYapabilir, false), fetchReply: true })
    : mesajVeyaInteraction.channel.send({ embeds: [embed], components: butonlariGetir(doubleYapabilir, false) }));

  const collector = replyMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30_000,
    filter: (i) => i.user.id === user.id,
  });

  collector.on('collect', async (i) => {
   try {
    if (i.customId === 'bj_hit') {
      oyuncuEli.push(deste.pop());
      oyuncuPuani = elPuaniHesapla(oyuncuEli);

      if (oyuncuPuani > 21) {
        // BUST (Kaybetti)
        collector.stop('bust');
        const sonKullanici = await kullaniciGetir(user.id, guildId);
        const bustEmbed = new EmbedBuilder()
          .setTitle('💥 BUST! (21 Geçildi)')
          .setColor(0xED4245)
          .setDescription(`21'i geçtiniz ve kaybettiniz!\n\n**Sizin Eliniz:** ${elGoster(oyuncuEli)} (\`${oyuncuPuani}\`)\n**Krupiye:** ${elGoster(krupiyeEli)} (\`${krupiyePuani}\`)`)
          .addFields(
            { name: '💸 Kayıp', value: `-${bahis.toLocaleString('tr-TR')} 🪙`, inline: true },
            { name: '💳 Kalan Bakiye', value: `${sonKullanici.coins.toLocaleString('tr-TR')} 🪙`, inline: true },
          );
        return i.update({ embeds: [bustEmbed], components: butonlariGetir(false, true) });
      }

      // Tam 21 → daha fazla kart çekmenin anlamı yok, otomatik "Kal"
      if (oyuncuPuani === 21) {
        collector.stop('stand');
        await i.deferUpdate();
        return bitir(replyMsg, user, guildId, oyuncuEli, krupiyeEli, deste, bahis);
      }

      const updateEmbed = new EmbedBuilder()
        .setTitle(`🃏 Blackjack — ${user.username}`)
        .setColor(RENKLER.RPG || 0xFEE75C)
        .addFields(
          { name: `👤 Sizin Eliniz (\`${oyuncuPuani}\`)`, value: elGoster(oyuncuEli), inline: false },
          { name: '🎰 Krupiyenin Eli', value: elGoster(krupiyeEli, true), inline: false },
          { name: '🪙 Bahis', value: `\`${bahis.toLocaleString('tr-TR')} coin\``, inline: true }
        );
      return i.update({ embeds: [updateEmbed], components: butonlariGetir(false, false) });
    }

    if (i.customId === 'bj_double') {
      // Ek bahsi atomik düş; bakiye yetmiyorsa double yapılamaz
      const ekBahis = await coinDegistir(user.id, guildId, -bahis);
      if (!ekBahis) {
        return i.reply({ content: '❌ Double için bakiyeniz yetersiz.', ephemeral: true });
      }
      bahis *= 2;
      oyuncuEli.push(deste.pop());
      oyuncuPuani = elPuaniHesapla(oyuncuEli);
      collector.stop(oyuncuPuani > 21 ? 'bust' : 'stand');
      await i.deferUpdate();
      return bitir(replyMsg, user, guildId, oyuncuEli, krupiyeEli, deste, bahis);
    }

    if (i.customId === 'bj_stand') {
      collector.stop('stand');
      await i.deferUpdate();
      return bitir(replyMsg, user, guildId, oyuncuEli, krupiyeEli, deste, bahis);
    }
   } catch (err) {
    console.error('[BLACKJACK] Hamle hatası:', err.message);
   }
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      // Süre doldu → bahis kaybolmasın, otomatik "Kal" (Stand) uygulanır
      await bitir(replyMsg, user, guildId, oyuncuEli, krupiyeEli, deste, bahis)
        .catch(() => replyMsg.edit({ components: butonlariGetir(false, true) }).catch(() => {}));
    }
  });
}

async function bitir(replyMsg, user, guildId, oyuncuEli, krupiyeEli, deste, bahis) {
  let oyuncuPuani = elPuaniHesapla(oyuncuEli);
  let krupiyePuani = elPuaniHesapla(krupiyeEli);

  // Krupiye 17'ye kadar kart çeker
  while (krupiyePuani < 17) {
    krupiyeEli.push(deste.pop());
    krupiyePuani = elPuaniHesapla(krupiyeEli);
  }

  const kullanici = await kullaniciGetir(user.id, guildId);
  let durum = '';
  let renk = 0x5865F2;
  let odeme = 0;

  if (oyuncuPuani > 21) {
    durum = '💥 21\'i aştığınız için kaybettiniz.';
    renk = 0xED4245;
  } else if (krupiyePuani > 21) {
    durum = '🎉 Krupiye 21\'i aştı! Kazandınız!';
    renk = 0x57F287;
    odeme = bahis * 2;
  } else if (oyuncuPuani > krupiyePuani) {
    durum = '🎉 Krupiyeden yüksek skor aldınız! Kazandınız!';
    renk = 0x57F287;
    odeme = bahis * 2;
  } else if (oyuncuPuani < krupiyePuani) {
    durum = '❌ Krupiye daha yüksek skor aldı. Kaybettiniz.';
    renk = 0xED4245;
  } else {
    durum = '🤝 Berabere (Push)! Bahisiniz iade edildi.';
    renk = 0xFEE75C;
    odeme = bahis;
  }

  // Ödeme atomik eklenir (oyun sırasında başka komutla değişen bakiye ezilmez)
  const sonUser = odeme > 0
    ? (await coinDegistir(user.id, guildId, odeme)) || kullanici
    : kullanici;

  const sonEmbed = new EmbedBuilder()
    .setTitle(`🃏 Oyun Bitti — ${durum}`)
    .setColor(renk)
    .setDescription(
      `**👤 Sizin Eliniz (\`${oyuncuPuani}\`):**\n${elGoster(oyuncuEli)}\n\n` +
      `**🎰 Krupiyenin Eli (\`${krupiyePuani}\`):**\n${elGoster(krupiyeEli)}`
    )
    .addFields(
      { name: '🪙 Bahis', value: `${bahis.toLocaleString('tr-TR')} 🪙`, inline: true },
      { name: '📊 Sonuç', value: odeme > bahis ? `+${(odeme - bahis).toLocaleString('tr-TR')} 🪙` : odeme === bahis ? 'İade' : `-${bahis.toLocaleString('tr-TR')} 🪙`, inline: true },
      { name: '💳 Güncel Bakiye', value: `${sonUser.coins.toLocaleString('tr-TR')} 🪙`, inline: true },
    )
    .setTimestamp();

  return replyMsg.edit({ embeds: [sonEmbed], components: butonlariGetir(false, true) }).catch(() => {});
}

module.exports = {
  isim: 'blackjack',
  alternatifler: ['bj', '21'],
  aciklama: 'Krupiyeye karşı butonlu Blackjack (21) oyunu oynar.',
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  async calistir(client, mesaj, args) {
    if (!args[0]) {
      return mesaj.reply('❌ Kullanım: `v!blackjack <bahis>` (Örn: `v!bj 100`)');
    }
    const bahis = parseInt(args[0], 10);
    if (isNaN(bahis) || bahis < 10) {
      return mesaj.reply('❌ Bahis en az 10 coin olmalıdır!');
    }
    return bjOyna(mesaj, mesaj.author, mesaj.guild.id, bahis);
  },

  async slashCalistir(client, interaction) {
    const bahis = interaction.options.getInteger('bahis');
    return bjOyna(interaction, interaction.user, interaction.guildId, bahis);
  },
};
