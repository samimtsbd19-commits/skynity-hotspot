import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
set -e

echo "=== Update env to use port 80 ==="
sed -i 's/MIKROTIK_DEFAULT_API_PORT=8728/MIKROTIK_DEFAULT_API_PORT=80/' /opt/skynity/.env
sed -i 's/MIKROTIK_DEFAULT_API_PORT=8728/MIKROTIK_DEFAULT_API_PORT=80/' /opt/skynity/ecosystem.config.js

echo "=== Verify ==="
grep MIKROTIK /opt/skynity/.env | head -10

echo "=== Restart API ==="
cd /opt/skynity
pm2 restart skynity-api --update-env
sleep 3
pm2 list

echo "=== Test API via admin endpoint ==="
curl -s -m 10 -H "Authorization: Bearer test" http://localhost:3001/monitoring/resource/ 2>/dev/null | head -c 300 || echo "API test done"
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
