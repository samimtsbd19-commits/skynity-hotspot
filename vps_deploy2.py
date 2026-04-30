import sys
import paramiko

# Fix encoding
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

def run(cmd):
    print(f"\n>>> {cmd[:60]}...")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[-2000:] if len(out) > 2000 else out)
    if err and err not in out:
        print('ERR:', err[-500:] if len(err) > 500 else err)
    return out, err

# 1. Clone repo
run('rm -rf /opt/skynity && git clone https://github.com/samimtsbd19-commits/skynity-hotspot.git /opt/skynity')

# 2. Create .env
env_content = """NODE_ENV=production
PORT=3001
APP_URL=http://46.202.166.89:3000
DATABASE_URL=postgres://skynity_user:skynity_strong_pass_2026@localhost:5432/skynity
POSTGRES_DB=skynity
POSTGRES_USER=skynity_user
POSTGRES_PASSWORD=skynity_strong_pass_2026
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
REDIS_URL=redis://localhost:6379
JWT_SECRET=skynity-jwt-secret-change-me-in-production-32b-2026
ENCRYPTION_KEY=skynity-encryption-key-change-me-32b-2026
MIKROTIK_HOST=192.168.1.213
MIKROTIK_USERNAME=admin
MIKROTIK_PASSWORD=4251
MIKROTIK_DEFAULT_API_PORT=80
MIKROTIK_API_TIMEOUT_MS=10000
MIKROTIK_MOCK=false
BOOTSTRAP_ORG_NAME=SKYNITY ISP
BOOTSTRAP_ADMIN_EMAIL=admin@skynity.net
BOOTSTRAP_ADMIN_PASSWORD=admin123
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_NUMBER=01XXXXXXXXX
NAGAD_MERCHANT_ID=
NAGAD_PRIVATE_KEY=
NAGAD_NUMBER=01XXXXXXXXX
SMS_API_URL=
SMS_API_KEY=
SMS_SENDER_ID=SKYNITY
TELEGRAM_BOT_TOKEN=
"""

with open('/tmp/skynity_env', 'w', encoding='utf-8') as f:
    f.write(env_content)

sftp = client.open_sftp()
sftp.put('/tmp/skynity_env', '/opt/skynity/.env')
sftp.close()

# 3. Start PostgreSQL
run('docker rm -f skynity-postgres 2>/dev/null; docker run -d --name skynity-postgres --restart unless-stopped -e POSTGRES_DB=skynity -e POSTGRES_USER=skynity_user -e POSTGRES_PASSWORD=skynity_strong_pass_2026 -p 5432:5432 -v skynity_pgdata:/var/lib/postgresql/data postgres:16-alpine')
run('sleep 8')

# 4. Install deps
run('cd /opt/skynity && pnpm install')

# 5. Migrations - use tsx directly with env set
run('cd /opt/skynity/packages/db && export DATABASE_URL=postgres://skynity_user:skynity_strong_pass_2026@localhost:5432/skynity && pnpm drizzle-kit migrate')

# 6. Seed
run('cd /opt/skynity/packages/db && export DATABASE_URL=postgres://skynity_user:skynity_strong_pass_2026@localhost:5432/skynity && npx tsx seed.ts')

# 7. Build API
run('cd /opt/skynity/apps/api && pnpm build')

# 8. Build Web
run('cd /opt/skynity/apps/web && pnpm build')

# 9. PM2
run('npm install -g pm2')

pm2_config = """module.exports = {
  apps: [
    {
      name: 'skynity-api',
      cwd: '/opt/skynity/apps/api',
      script: 'dist/server.js',
      env: { NODE_ENV: 'production', PORT: 3001 },
      instances: 1, exec_mode: 'fork', autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'skynity-web',
      cwd: '/opt/skynity/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3000 },
      instances: 1, exec_mode: 'fork', autorestart: true,
      max_memory_restart: '500M'
    }
  ]
};"""

with open('/tmp/skynity_pm2.js', 'w', encoding='utf-8') as f:
    f.write(pm2_config)
sftp = client.open_sftp()
sftp.put('/tmp/skynity_pm2.js', '/opt/skynity/ecosystem.config.js')
sftp.close()

# 10. Start services
run('pm2 delete all 2>/dev/null; cd /opt/skynity && pm2 start ecosystem.config.js')
run('pm2 save')
run('pm2 startup systemd')

# 11. Firewall
run('ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 3000/tcp && ufw allow 3001/tcp && ufw allow 51820/udp && ufw --force enable')

print("\n=== DEPLOYMENT COMPLETE ===")
print("API: http://46.202.166.89:3001")
print("Web: http://46.202.166.89:3000")

client.close()
