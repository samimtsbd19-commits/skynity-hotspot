import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
set -e

echo "=== Fix MikroTik API Port ==="
sed -i 's/MIKROTIK_DEFAULT_API_PORT=80/MIKROTIK_DEFAULT_API_PORT=8729/g' /opt/skynity/.env
sed -i 's/MIKROTIK_DEFAULT_API_PORT=80/MIKROTIK_DEFAULT_API_PORT=8729/g' /opt/skynity/ecosystem.config.js

echo "=== Install FreeRADIUS ==="
apt-get update -qq
apt-get install -y -qq freeradius freeradius-postgresql freeradius-utils 2>/dev/null || echo "apt install may need confirmation"

echo "=== FreeRADIUS Status ==="
which freeradius || which radiusd

"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

err = stderr.read().decode('utf-8', errors='replace')
if err.strip():
    print("STDERR:", err)

client.close()
