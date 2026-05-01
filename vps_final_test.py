import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
echo "=== Test MikroTik API from VPS (direct) ==="
curl -s -m 10 -u admin:4251 http://10.100.0.2:80/rest/system/resource 2>/dev/null | head -c 200

echo ""
echo "=== Test FreeRADIUS is responding ==="
echo "User-Name=test,User-Password=test" | radtest test test 127.0.0.1 0 radiussecret 2>&1 | tail -5

echo ""
echo "=== Check API logs for MikroTik connection ==="
cd /opt/skynity/apps/api
pm2 logs skynity-api --lines 10 --nostream 2>/dev/null | grep -i -E "mikrotik|router|error" | tail -10 || echo "No recent MikroTik errors"

echo ""
echo "=== Portal API test ==="
curl -s http://localhost:3001/portal-api/packages 2>/dev/null | head -c 200 || echo "Portal API check done"
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
