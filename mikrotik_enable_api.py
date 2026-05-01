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

# Re-enable plain API
run_cmd("ip service set api disabled=no port=8728")

# Update firewall to allow API port 8728 from admin-access
run_cmd("ip firewall filter remove [find comment=SKYNITY-Allow-Admin]")
run_cmd("ip firewall filter add chain=input protocol=tcp dst-port=22,8291,8728,8729 src-address-list=admin-access action=accept comment=SKYNITY-Allow-Admin")

# Verify services
run_cmd("ip service print")

# Test from MikroTik itself
run_cmd("/tool fetch url=\"http://127.0.0.1:8728/rest/system/resource\" mode=http")

print("\n=== API Enabled ===")
client.close()
