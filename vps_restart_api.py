import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
echo "=== Verify env fix ==="
grep MIKROTIK_DEFAULT_API_PORT /opt/skynity/.env
grep MIKROTIK_DEFAULT_API_PORT /opt/skynity/ecosystem.config.js

echo "=== Restart PM2 services ==="
cd /opt/skynity
pm2 restart skynity-api --update-env
pm2 restart skynity-web --update-env
pm2 save

sleep 3

echo "=== PM2 Status ==="
pm2 list

echo "=== Test API health ==="
curl -s http://localhost:3001/health 2>/dev/null || curl -s http://localhost:3001/ 2>/dev/null | head -1 || echo "API endpoint check done"

echo "=== Test MikroTik API connection from VPS ==="
curl -sk -u admin:4251 https://10.100.0.2:8729/rest/system/resource 2>/dev/null | head -c 200 || echo "MikroTik API-SSL check done"
curl -k -u admin:4251 https://192.168.1.213:8729/rest/system/resource 2>/dev/null | head -c 200 || echo "MikroTik WAN API check done"
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
