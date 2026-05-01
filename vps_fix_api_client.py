import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
set -e

echo "=== Fix MikroTik client to support HTTP ==="
CLIENT_FILE="/opt/skynity/apps/api/src/services/mikrotik/client.ts"

# Backup
cp "$CLIENT_FILE" "$CLIENT_FILE.bak"

# Replace useSsl: true with env-based SSL
sed -i 's/useSsl: true,/useSsl: process.env.MIKROTIK_USE_SSL !== "false",/' "$CLIENT_FILE"

# Update env to use HTTP on port 8728
sed -i 's/MIKROTIK_DEFAULT_API_PORT=8729/MIKROTIK_DEFAULT_API_PORT=8728/' /opt/skynity/.env
sed -i 's/MIKROTIK_DEFAULT_API_PORT=8729/MIKROTIK_DEFAULT_API_PORT=8728/' /opt/skynity/ecosystem.config.js

# Add USE_SSL env
grep -q MIKROTIK_USE_SSL /opt/skynity/.env || echo 'MIKROTIK_USE_SSL=false' >> /opt/skynity/.env
grep -q MIKROTIK_USE_SSL /opt/skynity/ecosystem.config.js || sed -i '/MIKROTIK_DEFAULT_API_PORT/a\        MIKROTIK_USE_SSL: "false",' /opt/skynity/ecosystem.config.js

echo "=== Verify changes ==="
grep -A2 -B2 "useSsl" "$CLIENT_FILE" | head -10
grep MIKROTIK /opt/skynity/.env | head -10

echo "=== Restart API ==="
cd /opt/skynity
pm2 restart skynity-api --update-env
sleep 3
pm2 list

echo "=== Test MikroTik API from VPS ==="
curl -s -m 10 -u admin:4251 http://10.100.0.2:8728/rest/system/resource 2>/dev/null | head -c 300 || echo "WireGuard API test done"
curl -s -m 10 -u admin:4251 http://192.168.1.213:8728/rest/system/resource 2>/dev/null | head -c 300 || echo "WAN API test done"
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
