import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# 1. Install Caddy
print("=== Installing Caddy ===")
stdin, stdout, stderr = client.exec_command('apt update && apt install -y caddy')
print(stdout.read().decode('utf-8', errors='replace')[-500:])
print(stderr.read().decode('utf-8', errors='replace')[-500:])

# 2. Create Caddyfile
caddyfile = '''admin.skynity.org {
  reverse_proxy localhost:3000
  encode gzip zstd
}

api.skynity.org {
  reverse_proxy localhost:3001
  encode gzip zstd
  header {
    X-Content-Type-Options nosniff
    X-Frame-Options SAMEORIGIN
    Strict-Transport-Security "max-age=31536000"
    -Server
  }
}
'''

with open('/tmp/Caddyfile', 'w') as f:
    f.write(caddyfile)

sftp = client.open_sftp()
sftp.put('/tmp/Caddyfile', '/etc/caddy/Caddyfile')
sftp.close()

# 3. Validate and reload Caddy
print("\n=== Caddy Validation ===")
stdin, stdout, stderr = client.exec_command('caddy validate --config /etc/caddy/Caddyfile')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

print("\n=== Reload Caddy ===")
stdin, stdout, stderr = client.exec_command('systemctl reload caddy || systemctl restart caddy')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# 4. Check Caddy status
print("\n=== Caddy Status ===")
stdin, stdout, stderr = client.exec_command('systemctl status caddy --no-pager | head -10')
print(stdout.read().decode('utf-8', errors='replace'))

# 5. Check ports 80/443
print("\n=== Ports ===")
stdin, stdout, stderr = client.exec_command("ss -tlnp | grep -E ':80 |:443 '")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
