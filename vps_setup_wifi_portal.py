import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Create hotspot directory
stdin, stdout, stderr = client.exec_command('mkdir -p /srv/hotspot')
print("mkdir:", stdout.read().decode('utf-8', errors='replace'))

# Upload style.css
with open('C:\\Users\\Shamim_pc\\Desktop\\dddd\\skynity\\hotspot-portal\\style.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

with open('/tmp/style.css', 'w', encoding='utf-8') as f:
    f.write(css_content)

sftp = client.open_sftp()
sftp.put('/tmp/style.css', '/srv/hotspot/style.css')

# Create enhanced login.html with dynamic packages from API
html_content = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SKYNITY WiFi</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .loading { text-align: center; padding: 2rem; color: #7AA3C8; }
    .loading::after { content: ""; display: inline-block; width: 20px; height: 20px; border: 2px solid #00EAFF; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-left: 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .package-card .type-badge { display: inline-block; font-size: 0.65rem; text-transform: uppercase; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(0,234,255,0.15); color: #00EAFF; margin-bottom: 0.5rem; }
    .get-started { text-decoration: none; display: block; text-align: center; }
    .contact-box { text-align: center; padding: 1rem; margin-top: 1rem; }
    .contact-box a { color: #00EAFF; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="starfield">
    <canvas id="stars"></canvas>
  </div>

  <div class="container">
    <header class="portal-header">
      <div class="logo-wrap">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stop-color="#00EAFF"/>
              <stop offset="100%" stop-color="#00FF88"/>
            </linearGradient>
          </defs>
          <path d="M50 5 L60 25 L85 20 L70 40 L90 60 L65 55 L55 80 L45 55 L20 60 L35 40 L15 20 L40 25 Z" stroke="url(#g)" stroke-width="3" fill="none"/>
          <circle cx="50" cy="45" r="12" stroke="url(#g)" stroke-width="2" fill="none"/>
          <circle cx="50" cy="45" r="4" fill="url(#g)"/>
        </svg>
        <div>
          <h1>SKYNITY</h1>
          <p>Connecting the Future</p>
        </div>
      </div>
    </header>

    <div class="panels">
      <div class="login-panel glass">
        <h2>WiFi Login</h2>
        <form name="login" action="$(link-login-only)" method="post">
          <input type="hidden" name="dst" value="$(link-orig)">
          <input type="hidden" name="popup" value="true">

          <div class="input-group">
            <label>Username</label>
            <input type="text" name="username" placeholder="Enter username" required>
          </div>
          <div class="input-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter password" required>
          </div>

          $(if error)
          <div class="error">$(error)</div>
          $(endif)

          <button type="submit" class="btn-primary">Connect to WiFi</button>
        </form>
        <div class="links">
          <a href="https://user.skynity.org">User Portal</a>
          <a href="https://user.skynity.org/portal/login" class="trial-link">Get Package</a>
        </div>
        <div class="contact-box">
          <p>Need help? <a href="tel:+8801234567890">Call Support</a></p>
        </div>
      </div>

      <div class="packages-panel">
        <h2>Our Packages</h2>
        <div id="package-loader" class="loading">Loading packages...</div>
        <div class="package-cards" id="package-cards" style="display:none;">
          <!-- Filled by JS -->
        </div>
      </div>
    </div>

    <footer class="portal-footer">
      <p>Payment Methods</p>
      <div class="payment-icons">
        <span class="payment-badge">bKash</span>
        <span class="payment-badge">Nagad</span>
        <span class="payment-badge">Rocket</span>
      </div>
      <p class="copyright">&copy; SKYNITY ISP. All rights reserved.</p>
    </footer>
  </div>

  <script>
    // Starfield animation
    const canvas = document.getElementById('stars');
    const ctx = canvas.getContext('2d');
    let w, h, stars = [];
    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    function init() { resize(); stars = []; for (let i = 0; i < 120; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.5, a: Math.random() * Math.PI * 2 }); }
    function animate() { ctx.clearRect(0, 0, w, h); for (let s of stars) { s.a += 0.005; const f = 0.5 + 0.5 * Math.sin(s.a); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(0, 234, 255, ${f * 0.8})`; ctx.fill(); } requestAnimationFrame(animate); }
    init(); animate();
    window.addEventListener('resize', () => { resize(); init(); });

    // Fetch packages from API
    async function loadPackages() {
      try {
        const res = await fetch('https://api.skynity.org/portal-api/packages');
        const json = await res.json();
        const packages = json.data || [];
        const container = document.getElementById('package-cards');
        const loader = document.getElementById('package-loader');

        if (!packages.length) {
          loader.textContent = 'No packages available.';
          return;
        }

        loader.style.display = 'none';
        container.style.display = 'flex';

        container.innerHTML = packages.map(pkg => `
          <div class="package-card glass">
            <span class="type-badge">${pkg.type || 'Internet'}</span>
            <div class="speed">${pkg.downloadMbps} Mbps</div>
            <div class="price">৳${pkg.priceBdt}</div>
            <div class="duration">${pkg.validityDays} Days</div>
            <ul class="features">
              <li>${pkg.uploadMbps} Mbps Upload</li>
              <li>Unlimited Data</li>
              ${pkg.burstDownloadMbps ? `<li>Burst: ${pkg.burstDownloadMbps} Mbps</li>` : ''}
            </ul>
            <a href="https://user.skynity.org/portal/login" class="get-started">
              <button class="btn-outline">Get Started</button>
            </a>
          </div>
        `).join('');
      } catch (e) {
        document.getElementById('package-loader').textContent = 'Unable to load packages.';
        console.error(e);
      }
    }
    loadPackages();
  </script>
</body>
</html>
'''

with open('/tmp/login.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

sftp.put('/tmp/login.html', '/srv/hotspot/login.html')
sftp.close()

# Update Caddyfile
print("\n=== Updating Caddyfile ===")
caddyfile = '''admin.skynity.org {
  reverse_proxy localhost:3000
  encode gzip zstd
}

user.skynity.org {
  reverse_proxy localhost:3000
  encode gzip zstd

  @root path /
  redir @root /portal/login 308
}

wifi.skynity.org {
  root * /srv/hotspot
  encode gzip zstd
  file_server
}

api.skynity.org {
  reverse_proxy localhost:3001
  encode gzip zstd
  header {
    X-Content-Type-Options nosniff
    X-Frame-Options SAMEORIGIN
    Strict-Transport-Security "max-age=31536000"
    -Server
  }
}
'''

with open('/tmp/Caddyfile', 'w') as f:
    f.write(caddyfile)

sftp = client.open_sftp()
sftp.put('/tmp/Caddyfile', '/etc/caddy/Caddyfile')
sftp.close()

# Validate and reload
stdin, stdout, stderr = client.exec_command('caddy validate --config /etc/caddy/Caddyfile')
print("Validation:", stdout.read().decode('utf-8', errors='replace')[-300:])

stdin, stdout, stderr = client.exec_command('systemctl reload caddy')
print("Reload:", stdout.read().decode('utf-8', errors='replace'))

# Test
print("\n=== Testing wifi.skynity.org ===")
stdin, stdout, stderr = client.exec_command("sleep 3 && curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code} | Time:%{time_total}s\n' https://wifi.skynity.org/")
print("Root:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code}\n' https://wifi.skynity.org/login.html")
print("login.html:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code}\n' https://wifi.skynity.org/style.css")
print("style.css:", stdout.read().decode('utf-8', errors='replace'))

# Check certificate
print("\n=== Caddy TLS logs ===")
stdin, stdout, stderr = client.exec_command("journalctl -u caddy --no-pager -n 10 2>/dev/null | grep -E 'wifi.skynity|certificate obtained'")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
