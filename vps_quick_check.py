import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
pm2 list
echo "---"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "web check failed"
echo " web status"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null || echo "api check failed"
echo " api status"
echo "---"
grep MIKROTIK_DEFAULT_API_PORT /opt/skynity/.env
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
