import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
cat /opt/skynity/infrastructure/radius/sql/schema.sql | head -50
echo "===WG==="
wg show 2>/dev/null || echo "wg not found"
echo "===WG Quick==="
ls /etc/wireguard/ 2>/dev/null || echo "no wg configs"
echo "===IP==="
ip addr | grep -E "wg|10\.100"
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
