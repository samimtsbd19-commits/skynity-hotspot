import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check why API is crashing
stdin, stdout, stderr = client.exec_command('pm2 logs skynity-api --lines 50 --nostream 2>&1 | tail -80')
out = stdout.read().decode('utf-8', errors='replace')
print('API LOGS:', out)

# Check what ports are in use
stdin, stdout, stderr = client.exec_command('ss -tlnp | grep -E ":3000|:3001"')
out = stdout.read().decode('utf-8', errors='replace')
print('PORTS:', out)

client.close()
