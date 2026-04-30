import sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Wait for cert
print("=== Waiting 8s for certificate ===")
time.sleep(8)

# Check TLS logs
print("\n=== TLS logs ===")
stdin, stdout, stderr = client.exec_command("journalctl -u caddy --no-pager -n 15 2>/dev/null | grep -E 'wifi.skynity|certificate obtained'")
print(stdout.read().decode('utf-8', errors='replace'))

# Test pages
print("\n=== Test wifi.skynity.org ===")
stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code} | Time:%{time_total}s\n' -L https://wifi.skynity.org/")
print("Root:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code}\n' https://wifi.skynity.org/login.html")
print("login.html:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code}\n' https://wifi.skynity.org/style.css")
print("style.css:", stdout.read().decode('utf-8', errors='replace'))

# Check content
print("\n=== HTML title check ===")
stdin, stdout, stderr = client.exec_command("curl -s -m 10 https://wifi.skynity.org/login.html | grep -o '<title>.*</title>'")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
