import paramiko
import sys
import time

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

# Check current API-SSL status
run_cmd("ip service print detail where name=api-ssl")
run_cmd("certificate print")

# Generate self-signed certificate
run_cmd("certificate add name=api-cert common-name=SKYNITY-Core-Router subject-alt-name=IP:10.100.0.2,IP:192.168.1.213 key-usage=tls-server key-size=2048")

# Wait a moment for key generation
time.sleep(3)

# Self-sign the certificate
run_cmd("certificate sign api-cert")

# Assign certificate to API-SSL
run_cmd("ip service set api-ssl certificate=api-cert")

# Verify
run_cmd("certificate print")
run_cmd("ip service print detail where name=api-ssl")

# Test local API
run_cmd("/tool fetch url=\"https://127.0.0.1:8729/rest/system/resource\" check-certificate=no")

print("\n=== Certificate Setup Complete ===")
client.close()
