// ==========================================
//  VirBot — Ana Giriş Noktası
//  Discord.js v14 | Node.js | Türkçe Bot
// ==========================================

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
} = require('discord.js');

const { keepAlive } = require('./keep_alive');
const { komutlariYukle } = require('./handlers/commandHandler');
const { olaylariYukle } = require('./handlers/eventHandler');
const { mongoBaslat } = require('./database/mongoose');

// ─── İstemci Oluştur ───────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildWebhooks,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.User,
  ],
});

// ─── MongoDB Bağlantısı ────────────────────────────────────
mongoBaslat().catch(hata => {
  console.error('[MongoDB] Bağlantı hatası:', hata.message);
});

// ─── Keep-Alive / Dashboard Sunucusu ──────────────────────
keepAlive(client);

// ─── Handler'ları Yükle ────────────────────────────────────
komutlariYukle(client);
olaylariYukle(client);

// ─── Yakalanmayan Hata Yönetimi ────────────────────────────
process.on('unhandledRejection', (hata) => {
  console.error('[KRİTİK] Yakalanmayan hata:', hata);
});

process.on('uncaughtException', (hata) => {
  console.error('[KRİTİK] Yakalanmayan istisna:', hata);
});

// ─── Bot'u Başlat ──────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN bulunamadı! .env dosyasını kontrol edin.');
  process.exit(1);
}

client.login(token).catch(hata => {
  console.error('❌ Bot başlatılamadı:', hata.message);
  process.exit(1);
});
