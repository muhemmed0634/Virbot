// ==========================================
//  VirBot v2 — Sunucu (Guild) Şeması
// ==========================================
'use strict';

const { Schema, model, models } = require('mongoose');

const GuildSchema = new Schema({
  guildId:        { type: String, required: true, unique: true },
  logKanalId:     { type: String, default: null },
  girisKanalId:   { type: String, default: null },
  cikisKanalId:   { type: String, default: null },
  girisCikisKanalId: { type: String, default: null },
  karsilamaKanalId: { type: String, default: null },
  vedasKanalId:   { type: String, default: null },
  ticketKanalId:  { type: String, default: null },
  verifyKanalId:  { type: String, default: null },
  verifyRoluId:   { type: String, default: null },
  honeypotKanalId:{ type: String, default: null },
  aiKanalId:      { type: String, default: null },
  sesOlusturKanalId: { type: String, default: null },
  sesKategoriId:     { type: String, default: null },
  sayacKanalId:   { type: String, default: null },
  sayacHedef:     { type: Number, default: 100 },
  antiAltAktif:   { type: Boolean, default: false },
  antiSpamAktif:  { type: Boolean, default: true },
  karalisteMod:   { type: Boolean, default: true },
  rssKaynaklar:   [{
    url:       String,
    kanalId:   String,
    gonderilen: [String],
  }],
}, { timestamps: true });

module.exports = models.Guild || model('Guild', GuildSchema);
