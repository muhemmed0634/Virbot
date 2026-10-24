// ==========================================
//  VirBot v6 — Express Dashboard + Keep-Alive
//  Discord OAuth2 + Gelişmiş Sunucu Yönetim & Özelleştirme Paneli

// ==========================================
'use strict';

const express    = require('express');
const session    = require('express-session');
const passport   = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const path       = require('path');
const { guildGetir, guildGuncelle, ayarGetir } = require('./modules/data/dataManager');
const app        = express();

// ─── Passport ──────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

function keepAlive(client) {
  const PORT = process.env.PORT || 3000;

  // ─── Middleware ────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── OAuth2 Stratejisi ─────────────────────────────────
  if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
    const callbackURL = process.env.CALLBACK_URL ||
      (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '')}/auth/callback` : null) ||
      'https://virbot-4.onrender.com/auth/callback';

    console.log(`[OAUTH2] Aktiv Callback URL: ${callbackURL}`);

    passport.use(new DiscordStrategy({
      clientID     : process.env.CLIENT_ID,
      clientSecret : process.env.CLIENT_SECRET,
      callbackURL  : callbackURL,
      scope        : ['identify', 'guilds'],
    }, (accessToken, refreshToken, profile, done) => done(null, profile)));

    app.use(session({
      secret: process.env.SESSION_SECRET || 'virbot-v6-ultra-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/auth/login', passport.authenticate('discord'));
    app.get('/auth/callback',
      passport.authenticate('discord', { failureRedirect: '/' }),
      (req, res) => res.redirect('/dashboard')
    );
    app.get('/auth/logout', (req, res) => {
      req.logout(() => res.redirect('/'));
    });
  }

  // ─── Ana Sayfa ─────────────────────────────────────────
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VirBot v6 — Ultra Gelişmiş Discord Botu</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Outfit',sans-serif;background:#05050f;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .bg{position:fixed;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(88,101,242,.2) 0,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(255,107,0,.15) 0,transparent 50%)}
    .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(88,101,242,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(88,101,242,.05) 1px,transparent 1px);background-size:45px 45px}
    .card{position:relative;z-index:1;text-align:center;padding:50px 70px;background:rgba(255,255,255,.03);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.09);border-radius:28px;max-width:540px;box-shadow:0 20px 50px rgba(0,0,0,.6)}
    .logo{width:110px;height:110px;border-radius:50%;border:3px solid rgba(255,107,0,.7);box-shadow:0 0 35px rgba(255,107,0,.5);margin:0 auto 20px;display:block}
    h1{font-size:3rem;font-weight:900;background:linear-gradient(135deg,#ff6b00,#5865f2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
    p{color:rgba(255,255,255,.6);font-size:1.05rem;margin-bottom:30px;line-height:1.6}
    .btn{display:inline-block;padding:14px 34px;border-radius:14px;font-weight:700;font-size:1rem;text-decoration:none;transition:.25s}
    .btn-primary{background:linear-gradient(135deg,#5865f2,#7289da);color:#fff;margin-right:12px;box-shadow:0 4px 20px rgba(88,101,242,.4)}
    .btn-secondary{background:rgba(255,255,255,.07);color:#fff;border:1px solid rgba(255,255,255,.12)}
    .btn:hover{transform:translateY(-3px);filter:brightness(1.15)}
    .badge{display:inline-block;padding:5px 14px;border-radius:100px;background:rgba(87,242,135,.15);color:#57f287;font-size:.85rem;font-weight:700;margin-bottom:18px}
    .author{margin-top:24px;font-size:.8rem;color:rgba(255,255,255,.3)}
  </style>
</head>
<body>
  <div class="bg"></div><div class="grid"></div>
  <div class="card">
    <img src="/logo" class="logo" alt="VirBot v6 Logo" onerror="this.style.display='none'">
    <div class="badge">🟢 Çevrimiçi • VirBot v6</div>
    <h1>VirBot v6</h1>
    <p>Ultra Gelişmiş, Tam Kapsamlı Discord Botu.<br>Gelişmiş Moderasyon · RPG · Jail · Auto-Rol · AI · Bump</p>
    <a href="/dashboard" class="btn btn-primary">📊 Kontrol Paneli</a>
    <a href="/ping" class="btn btn-secondary">🏓 Sistem Durumu</a>
    <div class="author">VirDormit Tarafından Geliştirilmiştir</div>
  </div>
</body>
</html>`);
  });

  // ─── Ping & Healthcheck ────────────────────────────────
  app.get(['/health', '/healthz', '/ping'], (req, res) => {
    res.status(200).json({
      status   : 'ok',
      versiyon : 'VirBot v6',
      durum    : 'çevrimiçi',
      botReady : client?.isReady?.() ?? false,
      ping     : client?.ws?.ping ?? -1,
      sunucular: client?.guilds?.cache?.size ?? 0,
      uptime   : process.uptime(),
      hafiza   : `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      zaman    : new Date().toISOString(),
    });
  });

  // ─── Render Keep-Alive Self-Ping ───────────────────────
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (externalUrl) {
    const httpLib = externalUrl.startsWith('https') ? require('https') : require('http');
    setInterval(() => {
      httpLib.get(`${externalUrl}/health`, () => {}).on('error', () => {});
    }, 10 * 60 * 1000);
  }

  // ─── Logo ──────────────────────────────────────────────
  app.get('/logo', (req, res) => {
    res.sendFile(path.join(__dirname, 'virbot.png'));
  });

  // ─── API: Sunucu Ayarları Kaydetme ─────────────────────
  app.post('/api/guild/:guildId/settings', async (req, res) => {
    try {
      const { guildId } = req.params;
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return res.status(404).json({ success: false, error: 'Sunucu bulunamadı.' });
      }

      // Kullanıcı oturumu varsa yetki kontrolü
      if (req.user && req.user.guilds) {
        const userGuild = req.user.guilds.find(g => g.id === guildId);
        const isAdmin = userGuild && (userGuild.owner || (userGuild.permissions & 0x8) === 0x8);
        if (!isAdmin) {
          return res.status(403).json({ success: false, error: 'Bu sunucuda yönetici yetkiniz yok!' });
        }
      }

      const guncellenecek = {};
      const {
        antiSpamAktif, antiCapsAktif, karalisteMod, antiAltAktif, antiRaidAktif,
        girisCikisKanalId, logKanalId, aiKanalId, autoRolId,
        aiOzelPrompt, ozelKarsilama
      } = req.body;

      if (antiSpamAktif !== undefined) guncellenecek.antiSpamAktif = Boolean(antiSpamAktif);
      if (antiCapsAktif !== undefined) guncellenecek.antiCapsAktif = Boolean(antiCapsAktif);
      if (karalisteMod !== undefined) guncellenecek.karalisteMod = Boolean(karalisteMod);
      if (antiAltAktif !== undefined) guncellenecek.antiAltAktif = Boolean(antiAltAktif);
      if (antiRaidAktif !== undefined) guncellenecek.antiRaidAktif = Boolean(antiRaidAktif);

      if (girisCikisKanalId !== undefined) guncellenecek.girisCikisKanalId = girisCikisKanalId || null;
      if (logKanalId !== undefined) guncellenecek.logKanalId = logKanalId || null;
      if (aiKanalId !== undefined) guncellenecek.aiKanalId = aiKanalId || null;
      if (autoRolId !== undefined) guncellenecek.autoRolId = autoRolId || null;
      if (aiOzelPrompt !== undefined) guncellenecek.aiOzelPrompt = String(aiOzelPrompt).slice(0, 1000);
      if (ozelKarsilama !== undefined) guncellenecek.ozelKarsilama = String(ozelKarsilama).slice(0, 500);

      await guildGuncelle(guildId, guncellenecek);
      return res.json({ success: true, message: 'Ayarlar başarıyla kaydedildi!' });
    } catch (err) {
      console.error('[API SETTINGS HATA]', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ─── Dashboard Sayfası ─────────────────────────────────
  app.get(['/dashboard', '/dashboard/:guildId'], async (req, res) => {
    const ping      = client?.ws?.ping ?? -1;
    const sunucular = client?.guilds?.cache?.size ?? 0;
    const uptime    = formatUptime(process.uptime());
    const kullanici = req.user;

    // Yönetici olunan sunucuları filtrele (OAuth varsa yetkili olanları, yoksa tüm bot sunucularını)
    let yonetilenSunucular = [];
    if (kullanici && kullanici.guilds) {
      yonetilenSunucular = kullanici.guilds
        .filter(g => (g.owner || (g.permissions & 0x8) === 0x8) && client.guilds.cache.has(g.id))
        .map(g => {
          const clientGuild = client.guilds.cache.get(g.id);
          return {
            id: g.id,
            isim: clientGuild?.name || g.name,
            icon: clientGuild?.iconURL({ dynamic: true }) || null,
            uyeSayisi: clientGuild?.memberCount || 0,
          };
        });
    } else {
      yonetilenSunucular = client?.guilds?.cache?.map(g => ({
        id: g.id,
        isim: g.name,
        icon: g.iconURL({ dynamic: true }) || null,
        uyeSayisi: g.memberCount,
      })) ?? [];
    }

    // Seçili sunucu
    const seciliGuildId = req.params.guildId || (yonetilenSunucular[0]?.id ?? null);
    const seciliGuild = seciliGuildId ? client.guilds.cache.get(seciliGuildId) : null;
    const seciliAyar = seciliGuildId ? (await guildGetir(seciliGuildId)) : {};

    // Kanallar ve Roller
    const metinKanallari = seciliGuild
      ? seciliGuild.channels.cache.filter(c => c.isTextBased() && !c.isVoiceBased()).map(c => ({ id: c.id, name: c.name }))
      : [];
    const roller = seciliGuild
      ? seciliGuild.roles.cache.filter(r => r.id !== seciliGuild.roles.everyone.id).map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
      : [];

    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VirBot v6 — Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Outfit',sans-serif;background:#05050f;color:#fff;min-height:100vh}
    .bg{position:fixed;inset:0;background:radial-gradient(ellipse at 10% 20%,rgba(88,101,242,.15) 0,transparent 50%),radial-gradient(ellipse at 90% 80%,rgba(255,107,0,.1) 0,transparent 50%);pointer-events:none}
    nav{position:sticky;top:0;z-index:100;padding:16px 36px;background:rgba(5,5,15,.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:18px}
    nav img{width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,107,0,.6)}
    nav h2{font-size:1.25rem;font-weight:800;background:linear-gradient(90deg,#ff6b00,#5865f2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    nav .spacer{flex:1}
    nav a{padding:8px 18px;border-radius:10px;font-size:.85rem;font-weight:600;text-decoration:none;background:rgba(255,255,255,.06);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.09);transition:.2s}
    nav a:hover{background:rgba(255,255,255,.14);color:#fff}
    .container{max-width:1160px;margin:0 auto;padding:36px 20px}
    .header-box{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;margin-bottom:32px}
    h1{font-size:2.2rem;font-weight:900}
    h1 span{background:linear-gradient(90deg,#ff6b00,#5865f2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .server-picker{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:8px 16px;color:#fff;font-family:'Outfit';font-size:1rem;font-weight:600;outline:none;cursor:pointer}
    .server-picker option{background:#0e0e22;color:#fff}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:32px}
    .stat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px;transition:.2s}
    .stat:hover{border-color:rgba(88,101,242,.4);transform:translateY(-2px)}
    .stat-icon{font-size:1.6rem;margin-bottom:8px}
    .stat-value{font-size:1.7rem;font-weight:900}
    .stat-label{font-size:.78rem;color:rgba(255,255,255,.45);margin-top:2px;text-transform:uppercase;letter-spacing:.05em}
    .panel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-bottom:32px}
    .panel{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:26px;position:relative}
    .panel-title{font-size:1.2rem;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:10px;color:#fff}
    .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)}
    .toggle-row:last-child{border-bottom:none}
    .toggle-label{font-weight:600;font-size:.95rem}
    .toggle-desc{font-size:.78rem;color:rgba(255,255,255,.4);margin-top:2px}
    .switch{position:relative;display:inline-block;width:48px;height:26px}
    .switch input{opacity:0;width:0;height:0}
    .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,.12);transition:.3s;border-radius:34px}
    .slider:before{position:absolute;content:"";height:20px;width:20px;left:3px;bottom:3px;background-color:white;transition:.3s;border-radius:50%}
    input:checked + .slider{background:linear-gradient(135deg,#5865f2,#57f287)}
    input:checked + .slider:before{transform:translateX(22px)}
    .form-group{margin-bottom:16px}
    .form-group label{display:block;font-size:.85rem;font-weight:600;margin-bottom:6px;color:rgba(255,255,255,.8)}
    .form-control{width:100%;padding:10px 14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#fff;font-family:'Outfit';font-size:.95rem;outline:none;transition:.2s}
    .form-control:focus{border-color:#5865f2;box-shadow:0 0 12px rgba(88,101,242,.3)}
    .form-control option{background:#0e0e22;color:#fff}
    textarea.form-control{resize:vertical;min-height:75px}
    .btn-save{display:block;width:100%;padding:14px;background:linear-gradient(135deg,#ff6b00,#5865f2);color:#fff;font-weight:700;font-size:1.05rem;border:none;border-radius:14px;cursor:pointer;transition:.25s;box-shadow:0 6px 20px rgba(88,101,242,.35);margin-top:20px}
    .btn-save:hover{transform:translateY(-2px);filter:brightness(1.15)}
    .toast{position:fixed;bottom:30px;right:30px;background:#57f287;color:#05050f;padding:14px 24px;border-radius:12px;font-weight:700;box-shadow:0 10px 25px rgba(0,0,0,.5);display:none;z-index:999;animation:slideIn .3s}
    @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    .footer{text-align:center;padding:30px;color:rgba(255,255,255,.3);font-size:.85rem}
  </style>
</head>
<body>
  <div class="bg"></div>
  <nav>
    <img src="/logo" alt="VirBot v6" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>'">
    <h2>VirBot v6 Panel</h2>
    <div class="spacer"></div>
    ${kullanici
      ? `<span style="color:rgba(255,255,255,.7);font-size:.9rem;margin-right:8px">👑 ${kullanici.username}</span>
         <a href="/auth/logout">Çıkış</a>`
      : `<a href="/auth/login">Discord ile Giriş</a>`
    }
  </nav>

  <div class="container">
    <div class="header-box">
      <div>
        <h1><span>VirBot v6</span> Yönetim Paneli</h1>
        <p style="color:rgba(255,255,255,.5);font-size:.95rem">Auto-Mod, Güvenlik, Auto-Rol ve Yapay Zeka Özelleştirme</p>
      </div>
      <div>
        <label style="font-size:.8rem;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">YÖNETİLECEK SUNUCU:</label>
        <select class="server-picker" onchange="location.href='/dashboard/' + this.value">
          ${yonetilenSunucular.map(s => `
            <option value="${s.id}" ${s.id === seciliGuildId ? 'selected' : ''}>
              ${escapeHtml(s.isim)} (${s.uyeSayisi} Üye)
            </option>
          `).join('') || '<option value="">Sunucu Bulunamadı</option>'}
        </select>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-icon">🏓</div>
        <div class="stat-value" style="color:#57f287">${ping}ms</div>
        <div class="stat-label">WebSocket Ping</div>
      </div>
      <div class="stat">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${seciliGuild ? seciliGuild.memberCount : 0}</div>
        <div class="stat-label">Sunucu Üyeleri</div>
      </div>
      <div class="stat">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">${uptime}</div>
        <div class="stat-label">Uptime</div>
      </div>
      <div class="stat">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">v6.0</div>
        <div class="stat-label">VirBot Sürümü</div>
      </div>
    </div>

    ${seciliGuild ? `
    <form id="settingsForm">
      <div class="panel-grid">
        <!-- 1. PANEL: AutoMod Korumaları -->
        <div class="panel">
          <div class="panel-title">🛡️ Auto-Mod & Güvenlik Korumaları</div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Anti-Spam Koruması</div>
              <div class="toggle-desc">Tekrarlanan ve hızlı mesajları engeller</div>
            </div>
            <label class="switch">
              <input type="checkbox" name="antiSpamAktif" ${seciliAyar.antiSpamAktif !== false ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Anti-Caps Koruması</div>
              <div class="toggle-desc">Aşırı büyük harf kullanımını engeller</div>
            </div>
            <label class="switch">
              <input type="checkbox" name="antiCapsAktif" ${seciliAyar.antiCapsAktif !== false ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Karaliste & Küfür Filtresi</div>
              <div class="toggle-desc">Yasaklı kelimeleri siler ve loglar</div>
            </div>
            <label class="switch">
              <input type="checkbox" name="karalisteMod" ${seciliAyar.karalisteMod !== false ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Anti-Alt (Yeni Hesap) Koruması</div>
              <div class="toggle-desc">Şüpheli yeni hesapları otomatik atar (Kick)</div>
            </div>
            <label class="switch">
              <input type="checkbox" name="antiAltAktif" ${seciliAyar.antiAltAktif ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Anti-Raid (Mass Join & Kick)</div>
              <div class="toggle-desc">Toplu baskınları ve zararlı botları durdurur</div>
            </div>
            <label class="switch">
              <input type="checkbox" name="antiRaidAktif" ${seciliAyar.antiRaidAktif !== false ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- 2. PANEL: Kanal ve Rol Yapılandırması -->
        <div class="panel">
          <div class="panel-title">⚙️ Kanal ve Rol Ayarları</div>

          <div class="form-group">
            <label>🚪 Giriş - Çıkış Kanalı</label>
            <select class="form-control" name="girisCikisKanalId">
              <option value="">-- Kapalı / Seçilmedi --</option>
              ${metinKanallari.map(c => `
                <option value="${c.id}" ${seciliAyar.girisCikisKanalId === c.id ? 'selected' : ''}>#${escapeHtml(c.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>📋 Denetim Kaydı (Log) Kanalı</label>
            <select class="form-control" name="logKanalId">
              <option value="">-- Kapalı / Seçilmedi --</option>
              ${metinKanallari.map(c => `
                <option value="${c.id}" ${seciliAyar.logKanalId === c.id ? 'selected' : ''}>#${escapeHtml(c.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>🤖 Yapay Zeka (AI) Kanalı</label>
            <select class="form-control" name="aiKanalId">
              <option value="">-- Kapalı / Seçilmedi --</option>
              ${metinKanallari.map(c => `
                <option value="${c.id}" ${seciliAyar.aiKanalId === c.id ? 'selected' : ''}>#${escapeHtml(c.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>🎭 Auto-Rol (Yeni Katılanlara Verilecek)</label>
            <select class="form-control" name="autoRolId">
              <option value="">-- Kapalı / Seçilmedi --</option>
              ${roller.map(r => `
                <option value="${r.id}" ${seciliAyar.autoRolId === r.id ? 'selected' : ''}>@${escapeHtml(r.name)}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 3. PANEL: Botu Kişiselleştirme & AI -->
        <div class="panel" style="grid-column: 1 / -1">
          <div class="panel-title">✨ Botu Kişiselleştirme & Karakter Ayarı</div>

          <div class="form-group">
            <label>🧠 Gemini AI Özel Sistem Promptu / Karakter Talimatı:</label>
            <textarea class="form-control" name="aiOzelPrompt" rows="3" placeholder="Örn: Bu sunucuda esprili bir anime karakteri gibi konuş, üyelerle şakalaş, vb.">${escapeHtml(seciliAyar.aiOzelPrompt || '')}</textarea>
          </div>

          <div class="form-group">
            <label>👋 Özel Karşılama Notu:</label>
            <textarea class="form-control" name="ozelKarsilama" rows="2" placeholder="Örn: Sunucumuza katıldığın için çok mutluyuz! Kuralları okumayı unutma.">${escapeHtml(seciliAyar.ozelKarsilama || '')}</textarea>
          </div>

          <button type="button" class="btn-save" onclick="ayarlariKaydet()">💾 Değişiklikleri Kaydet</button>
        </div>
      </div>
    </form>
    ` : `
      <div style="text-align:center;padding:60px;color:rgba(255,255,255,.4)">
        <h2>Lütfen yönetici olduğunuz bir sunucu seçin.</h2>
      </div>
    `}
  </div>

  <div class="toast" id="toast">✅ Ayarlar başarıyla güncellendi!</div>
  <div class="footer">VirBot v6 • VirDormit Tarafından Geliştirilmiştir • 7/24 Aktif</div>

  <script>
    async function ayarlariKaydet() {
      const form = document.getElementById('settingsForm');
      if (!form) return;
      const data = {
        antiSpamAktif: form.querySelector('input[name="antiSpamAktif"]')?.checked,
        antiCapsAktif: form.querySelector('input[name="antiCapsAktif"]')?.checked,
        karalisteMod: form.querySelector('input[name="karalisteMod"]')?.checked,
        antiAltAktif: form.querySelector('input[name="antiAltAktif"]')?.checked,
        antiRaidAktif: form.querySelector('input[name="antiRaidAktif"]')?.checked,
        girisCikisKanalId: form.querySelector('select[name="girisCikisKanalId"]')?.value || null,
        logKanalId: form.querySelector('select[name="logKanalId"]')?.value || null,
        aiKanalId: form.querySelector('select[name="aiKanalId"]')?.value || null,
        autoRolId: form.querySelector('select[name="autoRolId"]')?.value || null,
        aiOzelPrompt: form.querySelector('textarea[name="aiOzelPrompt"]')?.value || '',
        ozelKarsilama: form.querySelector('textarea[name="ozelKarsilama"]')?.value || '',
      };

      try {
        const res = await fetch('/api/guild/${seciliGuildId}/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const resData = await res.json();
        if (resData.success) {
          const t = document.getElementById('toast');
          t.style.display = 'block';
          setTimeout(() => t.style.display = 'none', 3000);
        } else {
          alert('Hata: ' + (resData.error || 'Kaydedilemedi'));
        }
      } catch (e) {
        alert('Bağlantı hatası: ' + e.message);
      }
    }
  </script>
</body>
</html>`);
  });

  app.listen(PORT, () => {
    console.log(`[DASHBOARD v6] VirBot Dashboard http://localhost:${PORT} adresinde aktif.`);
  });
}

function formatUptime(s) {
  const g = Math.floor(s / 86400);
  const sa = Math.floor((s % 86400) / 3600);
  const dk = Math.floor((s % 3600) / 60);
  return [g && `${g}g`, sa && `${sa}sa`, dk && `${dk}dk`].filter(Boolean).join(' ') || '< 1dk';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { keepAlive };
