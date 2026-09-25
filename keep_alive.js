// ==========================================
//  VirBot — Express Dashboard + Keep-Alive
//  Discord OAuth2 + Bot Stats Panel
// ==========================================
'use strict';

const express    = require('express');
const session    = require('express-session');
const passport   = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const path       = require('path');
const app        = express();

// ─── Passport ──────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

function keepAlive(client) {
  const PORT = process.env.PORT || 3000;

  // ─── OAuth2 Stratejisi ─────────────────────────────────
  if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
    passport.use(new DiscordStrategy({
      clientID     : process.env.CLIENT_ID,
      clientSecret : process.env.CLIENT_SECRET,
      callbackURL  : process.env.CALLBACK_URL || `http://localhost:${PORT}/auth/callback`,
      scope        : ['identify', 'guilds'],
    }, (accessToken, refreshToken, profile, done) => done(null, profile)));

    app.use(session({
      secret: process.env.SESSION_SECRET || 'virbot-secret',
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

  // ─── Middleware ────────────────────────────────────────
  app.use(express.json());

  // ─── Ana Sayfa ─────────────────────────────────────────
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VirBot — Ana Sayfa</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Outfit',sans-serif;background:#05050f;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .bg{position:fixed;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(88,101,242,.15) 0,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(255,107,0,.1) 0,transparent 50%)}
    .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(88,101,242,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(88,101,242,.04) 1px,transparent 1px);background-size:50px 50px}
    .card{position:relative;z-index:1;text-align:center;padding:60px 80px;background:rgba(255,255,255,.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08);border-radius:24px;max-width:520px}
    .logo{width:100px;height:100px;border-radius:50%;border:3px solid rgba(255,107,0,.6);box-shadow:0 0 30px rgba(255,107,0,.4);margin:0 auto 24px;display:block}
    h1{font-size:2.8rem;font-weight:900;background:linear-gradient(135deg,#ff6b00,#5865f2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
    p{color:rgba(255,255,255,.5);font-size:1rem;margin-bottom:32px;line-height:1.6}
    .btn{display:inline-block;padding:14px 32px;border-radius:12px;font-weight:700;font-size:.95rem;text-decoration:none;transition:.2s}
    .btn-primary{background:linear-gradient(135deg,#5865f2,#7289da);color:#fff;margin-right:12px}
    .btn-secondary{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.1)}
    .btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
    .badge{display:inline-block;padding:4px 12px;border-radius:100px;background:rgba(87,242,135,.12);color:#57f287;font-size:.8rem;font-weight:600;margin-bottom:20px}
  </style>
</head>
<body>
  <div class="bg"></div><div class="grid"></div>
  <div class="card">
    <img src="/logo" class="logo" alt="VirBot Logo" onerror="this.style.display='none'">
    <div class="badge">🟢 Çevrimiçi</div>
    <h1>VirBot</h1>
    <p>Ultra gelişmiş, tam kapsamlı Discord botu.<br>Moderasyon · RPG · Müzik · AI · Güvenlik</p>
    <a href="/dashboard" class="btn btn-primary">📊 Dashboard</a>
    <a href="/ping" class="btn btn-secondary">🏓 Ping</a>
  </div>
</body>
</html>`);
  });

  // ─── Ping & Healthcheck (Render.com için) ──────────────
  app.get(['/health', '/healthz', '/ping'], (req, res) => {
    res.status(200).json({
      status   : 'ok',
      durum    : 'çevrimiçi',
      botReady : client?.isReady?.() ?? false,
      ping     : client?.ws?.ping ?? -1,
      sunucular: client?.guilds?.cache?.size ?? 0,
      uptime   : process.uptime(),
      hafiza   : `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      zaman    : new Date().toISOString(),
    });
  });

  // ─── Render.com 7/24 Uyuma Engelleyici (Keep-Alive Self-Ping) ─
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (externalUrl) {
    const httpLib = externalUrl.startsWith('https') ? require('https') : require('http');
    setInterval(() => {
      httpLib.get(`${externalUrl}/health`, (res) => {}).on('error', (err) => {
        console.warn('[RENDER KEEP-ALIVE] Ping uyarısı:', err.message);
      });
    }, 10 * 60 * 1000); // Her 10 dakikada bir otomatik istek gönderir
    console.log(`[RENDER] 7/24 Keep-Alive devrede: ${externalUrl}`);
  }

  // ─── Logo ──────────────────────────────────────────────
  app.get('/logo', (req, res) => {
    res.sendFile(path.join(__dirname, 'virbot.png'));
  });

  // ─── Dashboard ─────────────────────────────────────────
  app.get('/dashboard', (req, res) => {
    const ping     = client?.ws?.ping ?? -1;
    const sunucular = client?.guilds?.cache?.size ?? 0;
    const uptime   = formatUptime(process.uptime());
    const kullanici = req.user;

    // Sunucu listesi
    const sunucuListesi = client?.guilds?.cache?.map(g => ({
      id: g.id, isim: g.name, uyeSayisi: g.memberCount,
    })) ?? [];

    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VirBot — Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Outfit',sans-serif;background:#05050f;color:#fff;min-height:100vh}
    .bg{position:fixed;inset:0;background:radial-gradient(ellipse at 10% 30%,rgba(88,101,242,.12) 0,transparent 50%),radial-gradient(ellipse at 90% 70%,rgba(255,107,0,.08) 0,transparent 50%);pointer-events:none}
    nav{position:sticky;top:0;z-index:100;padding:16px 40px;background:rgba(5,5,15,.8);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:16px}
    nav img{width:38px;height:38px;border-radius:50%;border:2px solid rgba(255,107,0,.5)}
    nav h2{font-size:1.2rem;font-weight:700;background:linear-gradient(90deg,#ff6b00,#5865f2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    nav .spacer{flex:1}
    nav a{padding:8px 18px;border-radius:8px;font-size:.85rem;font-weight:600;text-decoration:none;background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08);transition:.2s}
    nav a:hover{background:rgba(255,255,255,.12)}
    .container{max-width:1100px;margin:0 auto;padding:40px 24px}
    h1{font-size:2rem;font-weight:900;margin-bottom:8px}
    h1 span{background:linear-gradient(90deg,#ff6b00,#5865f2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .subtitle{color:rgba(255,255,255,.4);margin-bottom:36px;font-size:.95rem}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:36px}
    .stat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px;transition:.2s}
    .stat:hover{border-color:rgba(88,101,242,.3);transform:translateY(-2px)}
    .stat-icon{font-size:1.8rem;margin-bottom:12px}
    .stat-value{font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,#fff,rgba(255,255,255,.6));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .stat-label{font-size:.8rem;color:rgba(255,255,255,.4);margin-top:4px;text-transform:uppercase;letter-spacing:.05em}
    .ping-good{color:#57f287}.ping-ok{color:#fee75c}.ping-bad{color:#ed4245}
    .section-title{font-size:1.1rem;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:16px;display:flex;align-items:center;gap:8px}
    .servers{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:40px}
    .server{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px;transition:.2s}
    .server:hover{border-color:rgba(88,101,242,.25)}
    .server-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#5865f2,#7289da);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;flex-shrink:0}
    .server-name{font-weight:600;font-size:.95rem;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .server-count{font-size:.78rem;color:rgba(255,255,255,.4)}
    .footer{text-align:center;padding:32px;color:rgba(255,255,255,.2);font-size:.8rem}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:100px;background:rgba(87,242,135,.1);color:#57f287;font-size:.75rem;font-weight:600;margin-left:12px}
    .dot{width:7px;height:7px;border-radius:50%;background:#57f287;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  </style>
</head>
<body>
  <div class="bg"></div>
  <nav>
    <img src="/logo" alt="VirBot" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>'">
    <h2>VirBot Dashboard</h2>
    <div class="spacer"></div>
    ${kullanici
      ? `<span style="color:rgba(255,255,255,.6);font-size:.85rem;margin-right:8px">👤 ${kullanici.username}</span>
         <a href="/auth/logout">Çıkış Yap</a>`
      : `<a href="/auth/login">Discord ile Giriş</a>`
    }
  </nav>
  <div class="container">
    <h1><span>VirBot</span> Kontrol Paneli <span class="badge"><div class="dot"></div>Çevrimiçi</span></h1>
    <p class="subtitle">Gerçek zamanlı bot istatistikleri ve sunucu yönetimi</p>

    <div class="stats">
      <div class="stat">
        <div class="stat-icon">🏓</div>
        <div class="stat-value ${ping < 100 ? 'ping-good' : ping < 200 ? 'ping-ok' : 'ping-bad'}">${ping}ms</div>
        <div class="stat-label">WebSocket Ping</div>
      </div>
      <div class="stat">
        <div class="stat-icon">🌐</div>
        <div class="stat-value">${sunucular}</div>
        <div class="stat-label">Aktif Sunucu</div>
      </div>
      <div class="stat">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value" style="font-size:1.1rem">${uptime}</div>
        <div class="stat-label">Çalışma Süresi</div>
      </div>
      <div class="stat">
        <div class="stat-icon">📦</div>
        <div class="stat-value">${process.version}</div>
        <div class="stat-label">Node.js Sürümü</div>
      </div>
    </div>

    <div class="section-title">🌐 Sunucular (${sunucuListesi.length})</div>
    <div class="servers">
      ${sunucuListesi.map(s => `
      <div class="server">
        <div class="server-icon">${s.isim.charAt(0).toUpperCase()}</div>
        <div>
          <div class="server-name">${escapeHtml(s.isim)}</div>
          <div class="server-count">👥 ${s.uyeSayisi.toLocaleString('tr-TR')} üye</div>
        </div>
      </div>`).join('') || '<div style="color:rgba(255,255,255,.3);padding:20px">Henüz sunucu yok.</div>'}
    </div>
  </div>
  <div class="footer">VirBot v2.0 — Discord.js v14 | Powered with ❤️</div>
  <script>
    // Her 30 saniyede ping güncelle
    setInterval(async()=>{
      try{
        const r=await fetch('/ping');
        const d=await r.json();
        document.querySelector('.stat-value').textContent=d.ping+'ms';
      }catch(_){}
    },30000);
  </script>
</body>
</html>`);
  });

  app.listen(PORT, () => {
    console.log(`[DASHBOARD] Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
  });
}

function formatUptime(s) {
  const g = Math.floor(s / 86400);
  const sa = Math.floor((s % 86400) / 3600);
  const dk = Math.floor((s % 3600) / 60);
  return [g && `${g}g`, sa && `${sa}sa`, dk && `${dk}dk`].filter(Boolean).join(' ') || '< 1dk';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { keepAlive };
