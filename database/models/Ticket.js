// ==========================================
//  VirBot v2 — Ticket Şeması
// ==========================================
'use strict';

const { Schema, model, models } = require('mongoose');

const TicketSchema = new Schema({
  kanalId:      { type: String, required: true, unique: true },
  guildId:      String,
  sahipId:      String,
  sahipTag:     String,
  konu:         String,
  aciklama:     String,
  acik:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = models.Ticket || model('Ticket', TicketSchema);
