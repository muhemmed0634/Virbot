// ==========================================
//  VirBot — guildMemberAdd Olayı
//  Canvas Welcome, Anti-Alt, Sayaç
// ==========================================
'use strict';

const { ayarGetir, guildGuncelle } = require('../modules/data/dataManager');
const { antiAltKontrol } = require('../modules/security/antiAlt');
const { karsilamaKartiOlustur } = require('../modules/welcome/welcomeCard');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  isim: 'guildMemberAdd',

  async calistir(client, member) {
    const guild = member.guild;
    const ayarlar = ayarGetir(guild.id);
    if (!ayarlar) return;

    // 1. Anti-Alt Kontrolü
    await antiAltKontrol(member, client);

    // 2. Karşılama Kartı
    if (ayarlar.girisKanalId) {
      const kanal = guild.channels.cache.get(ayarlar.girisKanalId);
      if (kanal) {
        try {
          const buffer = await karsilamaKartiOlustur(member);
          const ek = new AttachmentBuilder(buffer, { name: 'hosgeldin.png' });
          await kanal.send({
            content: `Hoş geldin ${member}! Sunucumuz seninle beraber **${guild.memberCount}** kişi oldu. 🎉`,
            files: [ek]
          });
        } catch (err) {
          console.error('[GİRİŞ KARTI]', err);
        }
      }
    }

    // 3. Sayaç Güncelleme
    if (ayarlar.sayacKanalId && ayarlar.sayacHedef) {
      const kanal = guild.channels.cache.get(ayarlar.sayacKanalId);
      if (kanal) {
        const kalan = ayarlar.sayacHedef - guild.memberCount;
        if (kalan <= 0) {
          kanal.send(`🎉 Hedefimize ulaştık! Artık **${ayarlar.sayacHedef}** kişiyiz!`).catch(()=>{});
          await guildGuncelle(guild.id, { sayacHedef: 0 }); // Hedefe ulaşıldı, sıfırla
        } else {
          kanal.send(`📥 ${member} katıldı! Hedefe ulaşmamıza son **${kalan}** kişi kaldı.`).catch(()=>{});
        }
      }
    }
  },
};
