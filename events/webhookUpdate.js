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
      
      // En son oluşturulanı kontrol edelim
      const sonWebhook = webhooks.first();
      if (sonWebhook) {
        await webhookKontrol(sonWebhook, client);
      }
    } catch (hata) {
      // Yoksay
    }
  },
};
