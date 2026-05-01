import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
cat /opt/skynity/infrastructure/docker-compose.yml
echo "===RADIUS FILES==="
find /opt/skynity/infrastructure/radius -type f
echo "===DOCKER PS==="
docker ps | grep -i radius
echo "===FREERADIUS STATUS==="
systemctl status freeradius 2>/dev/null || echo "not systemd"
ps aux | grep -i radius | grep -v grep
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
