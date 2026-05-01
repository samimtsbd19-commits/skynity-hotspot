import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

vps = paramiko.SSHClient()
vps.set_missing_host_key_policy(paramiko.AutoAddPolicy())
vps.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
apt-get install -y sshpass 2>/dev/null || echo "apt done"

sshpass -p '4251' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 admin@10.100.0.2 '
/system identity print
/interface print
/ip address print
/ip hotspot print
/interface pppoe-server server print
/radius print
/ip firewall filter print
' 2>&1
"""
stdin, stdout, stderr = vps.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

vps.close()
