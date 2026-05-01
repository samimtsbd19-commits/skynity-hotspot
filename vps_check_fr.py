import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
which radiusd 2>/dev/null || which freeradius 2>/dev/null || echo "not in PATH"
dpkg -l | grep -i freeradius 2>/dev/null || rpm -qa | grep -i freeradius 2>/dev/null || echo "not found in package manager"
ps aux | grep -i radius | grep -v grep
ls /etc/freeradius/ 2>/dev/null || ls /etc/raddb/ 2>/dev/null || echo "no radius config dirs"
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
