// ==========================================
//  VirBot — channelCreate Olayı
//  Webhook Guard (İzinsiz webhook'ları siler)
// ==========================================
'use strict';

// Not: Aslında webhookUpdate olayı webhook oluşturulduğunda tetiklenir, 
// o yüzden bu mantığı webhookUpdate içinde yapmak daha sağlıklıdır.
const { webhookKontrol } = require('../modules/security/antiRaid');

module.exports = {
  isim: 'webhookUpdate',

  async calistir(client, channel) {
    try {
      const webhooks = await channel.fetchWebhooks().catch(() => null);
      if (!webhooks) return;
      
      // En son oluşturulanı kontrol edelim (Collection sırası garanti değil → ID/zamana göre sırala)
      const sonWebhook = [...webhooks.values()]
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0];
      // Yalnızca son 1 dakikada oluşturulan webhook yeni sayılır (güncelleme/silme olaylarını yoksay)
      if (sonWebhook && Date.now() - sonWebhook.createdTimestamp < 60_000) {
        await webhookKontrol(sonWebhook, client);
      }
    } catch (hata) {
      // Yoksay
    }
  },
};
