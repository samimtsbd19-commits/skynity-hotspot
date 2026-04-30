import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

def run(cmd, print_output=True):
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if print_output and out:
        print(out)
    if print_output and err and err not in out:
        print('ERR:', err)
    return out, err

# 1. Clone repo
print("=== 1. Cloning repository ===")
run('rm -rf /opt/skynity && git clone https://github.com/samimtsbd19-commits/skynity-hotspot.git /opt/skynity 2>&1')

# 2. Create production .env
print("\n=== 2. Creating production .env ===")
env_content = """NODE_ENV=production
PORT=3001
APP_URL=http://46.202.166.89:3000

# Database
DATABASE_URL=postgres://skynity_user:skynity_strong_pass_2026@localhost:5432/skynity
POSTGRES_DB=skynity
POSTGRES_USER=skynity_user
POSTGRES_PASSWORD=skynity_strong_pass_2026
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT & Encryption
JWT_SECRET=skynity-jwt-secret-change-me-in-production-32b-2026
ENCRYPTION_KEY=skynity-encryption-key-change-me-32b-2026

# MikroTik (REAL - user's router)
MIKROTIK_HOST=192.168.1.213
MIKROTIK_USERNAME=admin
MIKROTIK_PASSWORD=4251
MIKROTIK_DEFAULT_API_PORT=80
MIKROTIK_API_TIMEOUT_MS=10000
MIKROTIK_MOCK=false

# Bootstrap admin
BOOTSTRAP_ORG_NAME=SKYNITY ISP
BOOTSTRAP_ADMIN_EMAIL=admin@skynity.net
BOOTSTRAP_ADMIN_PASSWORD=admin123

# Payment (to be configured by user)
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_NUMBER=01XXXXXXXXX
NAGAD_MERCHANT_ID=
NAGAD_PRIVATE_KEY=
NAGAD_NUMBER=01XXXXXXXXX

# SMS
SMS_API_URL=
SMS_API_KEY=
SMS_SENDER_ID=SKYNITY

# Telegram (to be configured by user)
TELEGRAM_BOT_TOKEN=
"""

with open('/tmp/skynity_env', 'w') as f:
    f.write(env_content)

sftp = client.open_sftp()
sftp.put('/tmp/skynity_env', '/opt/skynity/.env')
sftp.close()

# 3. Start PostgreSQL via Docker
print("\n=== 3. Starting PostgreSQL ===")
run('docker run -d --name skynity-postgres --restart unless-stopped -e POSTGRES_DB=skynity -e POSTGRES_USER=skynity_user -e POSTGRES_PASSWORD=skynity_strong_pass_2026 -p 5432:5432 -v skynity_pgdata:/var/lib/postgresql/data postgres:16-alpine 2>&1 || echo "Postgres may already exist"')
run('sleep 5 && docker ps | grep skynity-postgres')

# 4. Install dependencies and build
print("\n=== 4. Installing dependencies ===")
run('cd /opt/skynity && pnpm install 2>&1')

# 5. Run migrations
print("\n=== 5. Running database migrations ===")
run('cd /opt/skynity/packages/db && pnpm drizzle-kit migrate 2>&1')

# 6. Seed database
print("\n=== 6. Seeding database ===")
run('cd /opt/skynity/packages/db && pnpm tsx seed.ts 2>&1')

# 7. Build API
print("\n=== 7. Building API ===")
run('cd /opt/skynity/apps/api && pnpm build 2>&1')

# 8. Build Web
print("\n=== 8. Building Web ===")
run('cd /opt/skynity/apps/web && pnpm build 2>&1')

# 9. Install PM2 for process management
print("\n=== 9. Installing PM2 ===")
run('npm install -g pm2 2>&1')

# 10. Create PM2 ecosystem file
print("\n=== 10. Creating PM2 config ===")
pm2_config = """module.exports = {
  apps: [
    {
      name: 'skynity-api',
      cwd: '/opt/skynity/apps/api',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      log_file: '/var/log/skynity-api.log',
      out_file: '/var/log/skynity-api-out.log',
      error_file: '/var/log/skynity-api-error.log'
    },
    {
      name: 'skynity-web',
      cwd: '/opt/skynity/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      log_file: '/var/log/skynity-web.log',
      out_file: '/var/log/skynity-web-out.log',
      error_file: '/var/log/skynity-web-error.log'
    }
  ]
};
"""
with open('/tmp/skynity_pm2.js', 'w') as f:
    f.write(pm2_config)
sftp = client.open_sftp()
sftp.put('/tmp/skynity_pm2.js', '/opt/skynity/ecosystem.config.js')
sftp.close()

# 11. Setup log directory
run('mkdir -p /var/log && touch /var/log/skynity-api.log /var/log/skynity-web.log')

# 12. Stop any existing PM2 processes and start new ones
print("\n=== 11. Starting services with PM2 ===")
run('pm2 delete all 2>/dev/null; cd /opt/skynity && pm2 start ecosystem.config.js 2>&1')
run('pm2 save 2>&1')
run('pm2 startup systemd 2>&1 || true')

# 13. Setup UFW firewall
print("\n=== 12. Configuring firewall ===")
run('ufw allow 22/tcp 2>/dev/null || true')
run('ufw allow 80/tcp 2>/dev/null || true')
run('ufw allow 443/tcp 2>/dev/null || true')
run('ufw allow 3000/tcp 2>/dev/null || true')
run('ufw allow 3001/tcp 2>/dev/null || true')
run('ufw allow 51820/udp 2>/dev/null || true')
run('ufw --force enable 2>/dev/null || true')

print("\n=== DEPLOYMENT COMPLETE ===")
print("API: http://46.202.166.89:3001")
print("Web: http://46.202.166.89:3000")
print("Admin Login: admin@skynity.net / admin123")

client.close()
