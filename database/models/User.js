// ==========================================
//  VirBot v2 — Kullanıcı Şeması (Level + RPG)
// ==========================================
'use strict';

const { Schema, model, models } = require('mongoose');

const UserSchema = new Schema({
  userId:    { type: String, required: true },
  guildId:   { type: String, required: true },

  // Level / XP
  xp:        { type: Number, default: 0 },
  level:     { type: Number, default: 0 },
  xpCooldown:{ type: Number, default: 0 },
  bgUrl:     { type: String, default: null },

  // Economy & RPG
  coins:        { type: Number, default: 0 },
  dailySon:     { type: Number, default: 0 },
  huntCooldown: { type: Number, default: 0 },
  cfStreak:     { type: Number, default: 0 }, // Coinflip kazanma serisi

  // Envanter
  zoo:       [{ isim: String, nadir: String, bonus: Number }],
  silah:     { type: { isim: String, guc: Number }, default: null },
  zirh:      { type: { isim: String, guc: Number }, default: null },

  // Uyarılar
  uyarilar:  [{ sebep: String, tarih: Date, veren: String }],
}, { timestamps: true });

UserSchema.index({ guildId: 1, xp: -1 });
UserSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = models.User || model('User', UserSchema);
