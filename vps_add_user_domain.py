import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# New Caddyfile with user.skynity.org
caddyfile = '''admin.skynity.org {
  reverse_proxy localhost:3000
  encode gzip zstd
}

user.skynity.org {
  reverse_proxy localhost:3000
  encode gzip zstd

  @root path /
  redir @root /portal/login 308
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

# Validate and reload
print("=== Caddy Validation ===")
stdin, stdout, stderr = client.exec_command('caddy validate --config /etc/caddy/Caddyfile')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

print("\n=== Reload Caddy ===")
stdin, stdout, stderr = client.exec_command('systemctl reload caddy')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Test domains
print("\n=== Test user.skynity.org ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 10 -o /dev/null -w "HTTP:%{http_code} | Redirect:%{redirect_url} | Time:%{time_total}s\\n" https://user.skynity.org/')
print(stdout.read().decode('utf-8', errors='replace'))

print("\n=== Test user.skynity.org/portal/login ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 10 -o /dev/null -w "HTTP:%{http_code} | Time:%{time_total}s\\n" https://user.skynity.org/portal/login')
print(stdout.read().decode('utf-8', errors='replace'))

print("\n=== Caddy Status ===")
stdin, stdout, stderr = client.exec_command('systemctl status caddy --no-pager | head -8')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
