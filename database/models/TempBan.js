// ==========================================
//  VirBot — Geçici Ban Şeması
//  Bot yeniden başlasa da süreli banlar kalkar
// ==========================================
'use strict';

const { Schema, model, models } = require('mongoose');

const TempBanSchema = new Schema({
  guildId: { type: String, required: true },
  userId:  { type: String, required: true },
  userTag: { type: String, default: null },
  bitis:   { type: Number, required: true }, // Unix ms
  sebep:   { type: String, default: null },
}, { timestamps: true });

TempBanSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = models.TempBan || model('TempBan', TempBanSchema);
