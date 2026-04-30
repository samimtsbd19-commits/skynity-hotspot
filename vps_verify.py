import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

stdin, stdout, stderr = client.exec_command('pm2 list && echo "---HEALTH---" && curl -s http://localhost:3001/health && echo "" && echo "---WEB---" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo ""')
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
if out:
    print(out)
if err:
    print('ERR:', err)
client.close()
