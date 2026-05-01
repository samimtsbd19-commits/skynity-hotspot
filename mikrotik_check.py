import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.213', username='admin', password='4251', timeout=15)

cmds = [
    "system resource print",
    "interface print",
    "ip address print",
    "ip route print",
    "ip dhcp-client print",
    "ip firewall nat print",
    "ppp profile print",
    "ip hotspot print",
    "ip pool print",
    "radius print",
    "ip hotspot profile print",
    "queue simple print",
    "user print",
]

for cmd in cmds:
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))

client.close()
