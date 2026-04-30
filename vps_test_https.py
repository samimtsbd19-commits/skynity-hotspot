import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

print("=== HTTPS admin.skynity.org ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 10 -o /dev/null -w "HTTP:%{http_code} | SSL:%{ssl_verify_result} | Time:%{time_total}s\\n" https://admin.skynity.org/login')
print(stdout.read().decode('utf-8', errors='replace'))

print("=== HTTPS api.skynity.org /health ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 10 -o /dev/null -w "HTTP:%{http_code} | SSL:%{ssl_verify_result} | Time:%{time_total}s\\n" https://api.skynity.org/health')
print(stdout.read().decode('utf-8', errors='replace'))

print("=== API response body ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 10 https://api.skynity.org/health')
print(stdout.read().decode('utf-8', errors='replace'))

print("\n=== HTTP->HTTPS redirect ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 10 -o /dev/null -w "HTTP:%{http_code} | Location:%{redirect_url}\\n" http://admin.skynity.org/login')
print(stdout.read().decode('utf-8', errors='replace'))

print("\n=== Caddy logs ===")
stdin, stdout, stderr = client.exec_command('journalctl -u caddy --no-pager -n 20 2>/dev/null | tail -15')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
