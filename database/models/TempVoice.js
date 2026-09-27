// ==========================================
//  VirBot v2 — Geçici Ses Odası Şeması
// ==========================================
'use strict';

const { Schema, model, models } = require('mongoose');

const TempVoiceSchema = new Schema({
  kanalId: { type: String, required: true, unique: true },
  sahipId: { type: String, required: true },
  guildId: { type: String, required: true },
}, { timestamps: true });

module.exports = models.TempVoice || model('TempVoice', TempVoiceSchema);
