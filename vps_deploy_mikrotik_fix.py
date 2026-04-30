import sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Pull and restart
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && git pull origin main && pm2 restart skynity-api && pm2 save')
print('DEPLOY:', stdout.read().decode('utf-8', errors='replace'))

time.sleep(3)

stdin, stdout, stderr = client.exec_command('curl -s -m 5 https://api.skynity.org/health')
print('API:', stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command('pm2 list')
print('PM2:', stdout.read().decode('utf-8', errors='replace'))

client.close()
