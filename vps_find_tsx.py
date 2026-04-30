import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

stdin, stdout, stderr = client.exec_command('ls /opt/skynity/apps/api/node_modules/tsx/dist/ 2>/dev/null && ls /opt/skynity/apps/api/node_modules/.bin/tsx* 2>/dev/null && file /opt/skynity/apps/api/node_modules/.bin/tsx')
out = stdout.read().decode('utf-8', errors='replace')
print(out)

client.close()
