// ==========================================
//  VirBot v6 — Sunucu (Guild) Şeması
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
  verifyYapilmayanRoluId: { type: String, default: null },
  honeypotKanalId:{ type: String, default: null },
  aiKanalId:      { type: String, default: null },
  sesOlusturKanalId: { type: String, default: null },
  sesKategoriId:     { type: String, default: null },
  xpKanalId:         { type: String, default: null },
  sayacKanalId:   { type: String, default: null },
  sayacHedef:     { type: Number, default: 100 },
  antiAltAktif:   { type: Boolean, default: false },
  antiSpamAktif:  { type: Boolean, default: true },
  antiCapsAktif:  { type: Boolean, default: true },
  antiRaidAktif:  { type: Boolean, default: true },
  karalisteMod:   { type: Boolean, default: true },
  // ――― Botu Kişiselleştirme ―――――――――――――――――――――――――――――――
  aiOzelPrompt:   { type: String, default: '' },
  ozelKarsilama:  { type: String, default: '' },
  // ――― Jail Sistemi ―――――――――――――――――――――――――――――――――――――――
  hapishane:      { type: Object, default: {} }, // userId → [rolId, ...]
  // ――― Auto Rol ――――――――――――――――――――――――――――――――――――――――――――――
  autoRolId:      { type: String, default: null },
  
  // ――― Level Rol Ödülü ――――――――――――――――――――――――――――――――――――――――――
  levelRoller:    { type: Object, default: {} }, // { '15': rolId, '35': rolId, '89': rolId }
  rssKaynaklar:   [{
    url:       String,
    kanalId:   String,
    gonderilen: [String],
  }],
}, { timestamps: true });

module.exports = models.Guild || model('Guild', GuildSchema);
