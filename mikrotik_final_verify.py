import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.213', username='admin', password='4251', timeout=15)

cmds = [
    "system identity print",
    "interface print",
    "ip address print",
    "ip firewall nat print",
    "ip firewall filter print",
    "ip hotspot print",
    "ip hotspot profile print",
    "interface pppoe-server server print",
    "ppp profile print",
    "ip pool print",
    "ip dhcp-server print",
    "radius print detail",
    "ip dns print",
    "ip service print",
]

for cmd in cmds:
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))

client.close()
