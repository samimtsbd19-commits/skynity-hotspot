import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Update Caddyfile with index
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

wifi.skynity.org {
  root * /srv/hotspot
  encode gzip zstd
  file_server {
    index login.html
  }
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
print("=== Validation ===")
stdin, stdout, stderr = client.exec_command('caddy validate --config /etc/caddy/Caddyfile')
print(stdout.read().decode('utf-8', errors='replace')[-300:])

print("\n=== Reload ===")
stdin, stdout, stderr = client.exec_command('systemctl reload caddy')
print(stdout.read().decode('utf-8', errors='replace'))

# Test
print("\n=== Test ===")
stdin, stdout, stderr = client.exec_command("curl -s -m 10 -o /dev/null -w 'HTTP:%{http_code} | Time:%{time_total}s\n' https://wifi.skynity.org/")
print("Root:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 10 https://wifi.skynity.org/ | head -20")
print("HTML head:\n", stdout.read().decode('utf-8', errors='replace'))

client.close()
