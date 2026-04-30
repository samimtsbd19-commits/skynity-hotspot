import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Read existing .env
stdin, stdout, stderr = client.exec_command("cat /opt/skynity/.env")
env_lines = stdout.read().decode('utf-8', errors='replace').strip().split('\n')

# Update key lines
new_env = []
for line in env_lines:
    if line.startswith('APP_URL='):
        new_env.append('APP_URL=https://admin.skynity.org')
    elif line.startswith('API_URL='):
        new_env.append('API_URL=https://api.skynity.org')
    elif line.startswith('NEXT_PUBLIC_API_URL='):
        new_env.append('NEXT_PUBLIC_API_URL=https://api.skynity.org')
    else:
        new_env.append(line)

# Ensure these exist
has_app_url = any(l.startswith('APP_URL=') for l in new_env)
has_api_url = any(l.startswith('API_URL=') for l in new_env)
has_next_pub = any(l.startswith('NEXT_PUBLIC_API_URL=') for l in new_env)
if not has_app_url:
    new_env.append('APP_URL=https://admin.skynity.org')
if not has_api_url:
    new_env.append('API_URL=https://api.skynity.org')
if not has_next_pub:
    new_env.append('NEXT_PUBLIC_API_URL=https://api.skynity.org')

env_content = '\n'.join(new_env) + '\n'
with open('/tmp/skynity.env', 'w') as f:
    f.write(env_content)

sftp = client.open_sftp()
sftp.put('/tmp/skynity.env', '/opt/skynity/.env')
sftp.close()

# Rebuild ecosystem.config.js with updated domains
stdin, stdout, stderr = client.exec_command("cat /opt/skynity/.env")
env_content2 = stdout.read().decode('utf-8', errors='replace').strip()

env_vars = {}
for line in env_content2.split('\n'):
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    if '=' in line:
        key, val = line.split('=', 1)
        if key != 'PORT':
            env_vars[key] = val

env_js_lines = []
for k, v in env_vars.items():
    v_escaped = v.replace('"', '\\"')
    env_js_lines.append(f'        {k}: "{v_escaped}"')

env_js = ',\n'.join(env_js_lines)

pm2_config = f"""module.exports = {{
  apps: [
    {{
      name: 'skynity-api',
      cwd: '/opt/skynity/apps/api',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/server.ts',
      env: {{
        NODE_ENV: 'production',
        PORT: 3001,
{env_js}
      }},
      instances: 1, exec_mode: 'fork', autorestart: true,
      max_memory_restart: '500M'
    }},
    {{
      name: 'skynity-web',
      cwd: '/opt/skynity/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {{
        NODE_ENV: 'production',
        PORT: 3000,
{env_js}
      }},
      instances: 1, exec_mode: 'fork', autorestart: true,
      max_memory_restart: '500M'
    }}
  ]
}};"""

with open('/tmp/skynity_pm2.js', 'w') as f:
    f.write(pm2_config)

sftp = client.open_sftp()
sftp.put('/tmp/skynity_pm2.js', '/opt/skynity/ecosystem.config.js')
sftp.close()

# Restart PM2
print("=== Restarting PM2 ===")
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && pm2 delete all 2>/dev/null; sleep 1; pm2 start ecosystem.config.js && pm2 save')
print(stdout.read().decode('utf-8', errors='replace'))

# Wait a moment and check
print("\n=== PM2 Status ===")
stdin, stdout, stderr = client.exec_command('sleep 3 && pm2 list')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
