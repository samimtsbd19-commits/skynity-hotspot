import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
freeradius -X 2>&1 | head -50 &
sleep 2
kill %1 2>/dev/null || true

echo "=== JOURNAL ==="
journalctl -u freeradius --no-pager -n 20 2>/dev/null || true

echo "=== RADIUS DIR ==="
ls -la /etc/freeradius/3.0/mods-enabled/ | head -20

echo "=== SQL FILE ==="
head -20 /etc/freeradius/3.0/mods-available/sql

echo "=== SITES DEFAULT ==="
grep -n "sql" /etc/freeradius/3.0/sites-available/default | head -20
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
