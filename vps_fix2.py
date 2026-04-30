import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

pm2_config = """module.exports = {
  apps: [
    {
      name: 'skynity-api',
      cwd: '/opt/skynity/apps/api',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/server.ts',
      env: { NODE_ENV: 'production', PORT: 3001 },
      instances: 1, exec_mode: 'fork', autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'skynity-web',
      cwd: '/opt/skynity/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3000 },
      instances: 1, exec_mode: 'fork', autorestart: true,
      max_memory_restart: '500M'
    }
  ]
};"""

with open('/tmp/skynity_pm2_v3.js', 'w', encoding='utf-8') as f:
    f.write(pm2_config)

sftp = client.open_sftp()
sftp.put('/tmp/skynity_pm2_v3.js', '/opt/skynity/ecosystem.config.js')
sftp.close()

stdin, stdout, stderr = client.exec_command('pm2 delete all 2>/dev/null; cd /opt/skynity && pm2 start ecosystem.config.js && pm2 save')
out = stdout.read().decode('utf-8', errors='replace')
print(out)

client.close()
