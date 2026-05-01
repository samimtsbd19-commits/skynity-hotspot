import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.213', username='admin', password='4251', timeout=15)

def run_cmd(cmd):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err:
        print(f"ERR: {err}")
    return out, err

# Remove existing hotspot profile if any
run_cmd("ip hotspot profile remove [find name=skynity-hotspot]")

# Add minimal profile first
run_cmd("ip hotspot profile add name=skynity-hotspot hotspot-address=10.20.0.1")

# Set properties one by one
run_cmd("ip hotspot profile set skynity-hotspot dns-name=wifi.skynity.org")
run_cmd("ip hotspot profile set skynity-hotspot html-directory=flash/hotspot")
run_cmd("ip hotspot profile set skynity-hotspot login-by=http-chap")
run_cmd("ip hotspot profile set skynity-hotspot use-radius=yes")
run_cmd("ip hotspot profile set skynity-hotspot radius-accounting=yes")

# Remove and add hotspot server
run_cmd("ip hotspot remove [find name=hotspot1]")
run_cmd("ip hotspot add name=hotspot1 interface=ether2-Hotspot profile=skynity-hotspot addresses-per-mac=2 disabled=no")

# Verify
run_cmd("ip hotspot profile print")
run_cmd("ip hotspot print")
run_cmd("interface pppoe-server server print")
run_cmd("ppp profile print")
run_cmd("ip firewall nat print")
run_cmd("ip firewall filter print")
run_cmd("ip address print")
run_cmd("ip pool print")

print("\n=== MikroTik Config Verification ===")
client.close()
