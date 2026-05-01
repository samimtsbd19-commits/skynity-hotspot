import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
echo "=== Test MikroTik API via WireGuard ==="
curl -sk -m 10 -u admin:4251 https://10.100.0.2:8729/rest/system/resource 2>/dev/null && echo "" || echo "WireGuard API failed"

echo "=== Test MikroTik API via WAN ==="
curl -sk -m 10 -u admin:4251 https://192.168.1.213:8729/rest/system/resource 2>/dev/null && echo "" || echo "WAN API failed"

echo "=== Test RADIUS from MikroTik ==="
# We can't easily test from MikroTik via SSH from here, but let's test FreeRADIUS is listening
ss -ulnp | grep -E "1812|1813"

echo "=== FreeRADIUS status ==="
systemctl is-active freeradius

"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
