import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.213', username='admin', password='4251', timeout=15)

cmds = [
    "radius print detail",
    "radius incoming print",
    "interface wireguard print",
    "interface wireguard peers print",
    "ip firewall filter print",
    "ip service print",
    "ip neighbor print",
    "system identity print",
    "certificate print",
    "ip dns print",
]

for cmd in cmds:
    print(f"\n=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))

client.close()
