// ==========================================
//  VirBot v2 — Çekiliş Şeması
// ==========================================
'use strict';

const { Schema, model, models } = require('mongoose');

const GiveawaySchema = new Schema({
  mesajId:       { type: String, required: true, unique: true },
  kanalId:       String,
  guildId:       String,
  baslatan:      String,
  odul:          String,
  kazananSayisi: { type: Number, default: 1 },
  bitisTarihi:   Number,
  katilimcilar:  [String],
  minDavet:      { type: Number, default: 0 },
  rolSarti:      { type: String, default: null },
  minHesapYasi:  { type: Number, default: 0 },
  bitti:         { type: Boolean, default: false },
}, { timestamps: true });

module.exports = models.Giveaway || model('Giveaway', GiveawaySchema);
