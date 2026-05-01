import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
echo "=== Test MikroTik API via WireGuard ==="
curl -v -m 15 -u admin:4251 http://10.100.0.2:8728/rest/system/resource 2>&1

echo ""
echo "=== Test MikroTik API via WAN ==="
curl -v -m 15 -u admin:4251 http://192.168.1.213:8728/rest/system/resource 2>&1
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
