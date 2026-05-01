import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Connect to VPS first, then from VPS SSH to MikroTik via WireGuard
vps = paramiko.SSHClient()
vps.set_missing_host_key_policy(paramiko.AutoAddPolicy())
vps.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
echo "=== Ping MikroTik via WireGuard ==="
ping -c 2 10.100.0.2

echo "=== SSH to MikroTik via WireGuard ==="
sshpass -p '4251' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 admin@10.100.0.2 'system identity print; interface print; ip hotspot print; interface pppoe-server server print; radius print' 2>&1 || echo "sshpass not installed or ssh failed"
"""
stdin, stdout, stderr = vps.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

vps.close()
