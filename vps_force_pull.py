import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

stdin, stdout, stderr = client.exec_command('cd /opt/skynity && git log --oneline -3')
print('BEFORE:', stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command('cd /opt/skynity && git fetch origin main && git reset --hard origin/main')
print('PULL:', stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command('cd /opt/skynity && git log --oneline -3')
print('AFTER:', stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command('cd /opt/skynity && pm2 restart skynity-api && pm2 save')
print('RESTART:', stdout.read().decode('utf-8', errors='replace'))

client.close()
