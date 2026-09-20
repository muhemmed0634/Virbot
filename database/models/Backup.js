// ==========================================
//  VirBot v2 — Backup Şeması
// ==========================================
'use strict';

const { Schema, model, models } = require('mongoose');

const BackupSchema = new Schema({
  guildId:    { type: String, required: true },
  backupId:   { type: String, required: true, unique: true },
  alanKisi:   String,
  kanallar:   [Schema.Types.Mixed],
  roller:     [Schema.Types.Mixed],
  ayarlar:    Schema.Types.Mixed,
}, { timestamps: true });

module.exports = models.Backup || model('Backup', BackupSchema);
