import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

vps = paramiko.SSHClient()
vps.set_missing_host_key_policy(paramiko.AutoAddPolicy())
vps.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

# Update ecosystem.config.js to use WireGuard IP for MikroTik
cmd = """
cd /opt/skynity
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'skynity-api',
      cwd: '/opt/skynity/apps/api',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/server.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        MIKROTIK_HOST: '10.100.0.2',
        MIKROTIK_USERNAME: 'admin',
        MIKROTIK_PASSWORD: '4251',
        MIKROTIK_DEFAULT_API_PORT: '80',
        MIKROTIK_USE_SSL: 'false',
        MIKROTIK_MOCK: 'false',
        MIKROTIK_API_TIMEOUT_MS: '10000',
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: '5432',
        POSTGRES_DB: 'skynity',
        POSTGRES_USER: 'skynity_user',
        POSTGRES_PASSWORD: 'skynity_pass',
        JWT_SECRET: 'skynity-jwt-secret-change-me-in-production-32b',
        APP_URL: 'https://admin.skynity.org',
        RADIUS_HOST: '127.0.0.1',
        RADIUS_SECRET: 'radiussecret',
        RADIUS_AUTH_PORT: '1812',
        RADIUS_ACCT_PORT: '1813',
      }
    },
    {
      name: 'skynity-web',
      cwd: '/opt/skynity/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://api.skynity.org',
      }
    }
  ]
};
EOF

cat ecosystem.config.js
"""
stdin, stdout, stderr = vps.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

# Restart PM2
print("\n=== Restarting PM2 ===")
stdin2, stdout2, stderr2 = vps.exec_command("cd /opt/skynity && pm2 restart ecosystem.config.js && pm2 save", get_pty=True)
for line in iter(stdout2.readline, ""):
    print(line, end="")

vps.close()
