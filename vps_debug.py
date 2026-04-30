import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check API logs
stdin, stdout, stderr = client.exec_command('pm2 logs skynity-api --lines 30 --nostream 2>&1 | tail -40')
out = stdout.read().decode('utf-8', errors='replace')
print('API LOGS:', out)

# Check if .env exists and what DATABASE_URL looks like
stdin, stdout, stderr = client.exec_command('ls -la /opt/skynity/.env && cat /opt/skynity/.env | grep DATABASE_URL')
out = stdout.read().decode('utf-8', errors='replace')
print('ENV CHECK:', out)

# Check what env vars the API process has
stdin, stdout, stderr = client.exec_command("ps eww $(pgrep -f 'tsx') 2>/dev/null | grep -oE 'DATABASE_URL=[^ ]+' | head -1 || echo 'process not found'")
out = stdout.read().decode('utf-8', errors='replace')
print('PROC ENV:', out)

client.close()
