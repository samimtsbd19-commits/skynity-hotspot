import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
cat /opt/skynity/infrastructure/radius/radiusd.conf 2>/dev/null | grep -i secret | head -5
cat /opt/skynity/infrastructure/radius/clients.conf 2>/dev/null | head -20
cat /opt/skynity/.env | grep -i radius
cat /opt/skynity/.env | grep -i mikrotik
echo "---"
ls /opt/skynity/infrastructure/radius/
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
