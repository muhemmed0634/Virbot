// ==========================================
//  VirBot — Davet Takip Yardımcısı
//  Kim kimi davet etti? (inviteCreate/inviteDelete ile senkron önbellek)
// ==========================================
'use strict';

/**
 * Sunucunun davetlerini önbelleğe alır.
 * @param {Guild} guild
 * @param {Client} client
 */
async function davetleriOnbellege(guild, client) {
  if (!client._oncekiDavetler) client._oncekiDavetler = new Map();
  const davetler = await guild.invites.fetch().catch(() => null);
  if (!davetler) return;
  client._oncekiDavetler.set(guild.id, new Map(davetler.map(d => [d.code, { uses: d.uses || 0, inviter: d.inviter || null }])));
}

/** Yeni oluşturulan daveti önbelleğe ekler (aksi halde ilk kullanımı tespit edilemiyordu). */
function davetEkle(invite, client) {
  if (!invite.guild) return;
  if (!client._oncekiDavetler) client._oncekiDavetler = new Map();
  const harita = client._oncekiDavetler.get(invite.guild.id) || new Map();
  harita.set(invite.code, { uses: invite.uses || 0, inviter: invite.inviter || null });
  client._oncekiDavetler.set(invite.guild.id, harita);
}

/** Silinen daveti önbellekten çıkarır. */
function davetSil(invite, client) {
  if (!invite.guild) return;
  client._oncekiDavetler?.get(invite.guild.id)?.delete(invite.code);
}

/**
 * Yeni katılan üyeyi hangi davetin getirdiğini bulur ve önbelleği günceller.
 * @returns {Promise<User|null>} davet eden kullanıcı
 */
async function davetEdeniBul(member, client) {
  const guild = member.guild;
  if (!client._oncekiDavetler) client._oncekiDavetler = new Map();
  if (!client._uyeDavetEdenler) client._uyeDavetEdenler = new Map();

  const davetler = await guild.invites.fetch().catch(() => null);
  if (!davetler) return null;

  const onceki = client._oncekiDavetler.get(guild.id) || new Map();
  let davetEden = null;

  for (const [kod, davet] of davetler) {
    const eskiKullanim = onceki.get(kod)?.uses ?? 0; // Önbellekte yoksa yeni davet → 0
    if ((davet.uses || 0) > eskiKullanim) {
      davetEden = davet.inviter || null;
      break;
    }
  }

  // Tek kullanımlık (maxUses=1) davetler kullanılınca silinir → listede yoksa o davettir
  if (!davetEden) {
    for (const [kod, eski] of onceki) {
      if (!davetler.has(kod) && eski.inviter) {
        davetEden = eski.inviter;
        break;
      }
    }
  }

  client._oncekiDavetler.set(guild.id, new Map(davetler.map(d => [d.code, { uses: d.uses || 0, inviter: d.inviter || null }])));
  if (davetEden) {
    client._uyeDavetEdenler.set(`${guild.id}-${member.id}`, { id: davetEden.id, tag: davetEden.tag });
  }
  return davetEden;
}

/** Ayrılan üyeyi kimin davet ettiğini döner (bellekten). */
function davetEdenGetir(member, client) {
  return client._uyeDavetEdenler?.get(`${member.guild.id}-${member.id}`) || null;
}

module.exports = { davetleriOnbellege, davetEkle, davetSil, davetEdeniBul, davetEdenGetir };
