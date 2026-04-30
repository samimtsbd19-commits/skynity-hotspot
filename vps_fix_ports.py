import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Read .env file
stdin, stdout, stderr = client.exec_command("cat /opt/skynity/.env")
env_content = stdout.read().decode('utf-8', errors='replace').strip()

# Parse env vars, but exclude PORT
env_vars = {}
for line in env_content.split('\n'):
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    if '=' in line:
        key, val = line.split('=', 1)
        if key != 'PORT':  # Exclude PORT so each app can have its own
            env_vars[key] = val

# Build proper JS env object
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

with open('/tmp/skynity_pm2_ports.js', 'w', encoding='utf-8') as f:
    f.write(pm2_config)

sftp = client.open_sftp()
sftp.put('/tmp/skynity_pm2_ports.js', '/opt/skynity/ecosystem.config.js')
sftp.close()

# Validate
stdin, stdout, stderr = client.exec_command('node -c /opt/skynity/ecosystem.config.js && echo "JS VALID"')
out = stdout.read().decode('utf-8', errors='replace')
print('VALIDATION:', out)

# Kill everything and restart
stdin, stdout, stderr = client.exec_command('pm2 delete all 2>/dev/null; fuser -k 3000/tcp 3001/tcp 2>/dev/null; sleep 1; cd /opt/skynity && pm2 start ecosystem.config.js && pm2 save')
out = stdout.read().decode('utf-8', errors='replace')
print('RESTART:', out)

client.close()
