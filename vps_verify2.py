import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

stdin, stdout, stderr = client.exec_command('sleep 3 && curl -s http://localhost:3001/health && echo "" && curl -s -o /dev/null -w "Web Status: %{http_code}\n" http://localhost:3000 && echo "" && curl -s -o /dev/null -w "Portal Status: %{http_code}\n" http://localhost:3000/portal')
out = stdout.read().decode('utf-8', errors='replace')
print(out)

client.close()
