import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
echo "=== Test port 80 (www/rest) via WireGuard ==="
curl -v -m 15 -u admin:4251 http://10.100.0.2:80/rest/system/resource 2>&1 | head -40

echo ""
echo "=== Test port 80 via WAN ==="
curl -v -m 15 -u admin:4251 http://192.168.1.213:80/rest/system/resource 2>&1 | head -40

echo ""
echo "=== Test port 8728 with binary API ==="
curl -v -m 5 http://10.100.0.2:8728/ 2>&1 | head -20
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
