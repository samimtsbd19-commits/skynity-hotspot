import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Pull latest changes
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && git pull origin main')
out = stdout.read().decode('utf-8', errors='replace')
print('GIT PULL:', out)

# Restart PM2
stdin, stdout, stderr = client.exec_command('pm2 restart all && sleep 3 && pm2 list')
out = stdout.read().decode('utf-8', errors='replace')
print('RESTART:', out)

# Test
stdin, stdout, stderr = client.exec_command("curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@skynity.net\",\"password\":\"admin123\"}'")
out = stdout.read().decode('utf-8', errors='replace')
print('LOGIN TEST:', out[:300])

client.close()
