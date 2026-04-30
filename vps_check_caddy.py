import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check if caddy is installed
stdin, stdout, stderr = client.exec_command('which caddy; caddy version 2>/dev/null; echo "---"; systemctl status caddy --no-pager 2>/dev/null | head -5')
print('CADDY CHECK:')
print(stdout.read().decode('utf-8', errors='replace'))

# Check ports 80/443
stdin, stdout, stderr = client.exec_command("ss -tlnp | grep -E ':80 |:443 '")
print('PORTS 80/443:')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
