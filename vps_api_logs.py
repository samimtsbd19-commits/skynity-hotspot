import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

stdin, stdout, stderr = client.exec_command('pm2 logs skynity-api --lines 50 --nostream 2>&1 | tail -60')
out = stdout.read().decode('utf-8', errors='replace')
print(out)

client.close()
