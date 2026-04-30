import sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check Caddy logs for certificate
print("=== Caddy TLS logs ===")
stdin, stdout, stderr = client.exec_command("journalctl -u caddy --no-pager -n 30 2>/dev/null | grep -E 'user.skynity|certificate'")
print(stdout.read().decode('utf-8', errors='replace'))

# Wait and test again
print("\n=== Waiting 5s and retesting ===")
time.sleep(5)

stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code} | Time:%{time_total}s\n' -L https://user.skynity.org/")
print("user.skynity.org:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code} | Time:%{time_total}s\n' https://user.skynity.org/portal/login")
print("user.skynity.org/portal/login:", stdout.read().decode('utf-8', errors='replace'))

# Test from localhost
stdin, stdout, stderr = client.exec_command("curl -s -m 10 --resolve user.skynity.org:443:127.0.0.1 -o /dev/null -w 'HTTP:%{http_code}\n' https://user.skynity.org/portal/login")
print("Via localhost:", stdout.read().decode('utf-8', errors='replace'))

client.close()
