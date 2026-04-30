import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# 1. Pull latest code
print("=== 1. Git Pull ===")
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && git pull origin main')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# 2. DB Migration
print("\n=== 2. DB Migration ===")
stdin, stdout, stderr = client.exec_command(
    'docker exec skynity-postgres psql -U skynity_user -d skynity -c "ALTER TABLE packages ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT \'{}\';"'
)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Verify
stdin, stdout, stderr = client.exec_command('docker exec skynity-postgres psql -U skynity_user -d skynity -c "\\d packages" | grep template')
print("Verify:", stdout.read().decode('utf-8', errors='replace'))

# 3. Install dependencies (in case new packages)
print("\n=== 3. Install Dependencies ===")
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && pnpm install 2>&1 | tail -5')
print(stdout.read().decode('utf-8', errors='replace'))

# 4. Upload hotspot portal files
print("\n=== 4. Upload Hotspot Portal ===")
with open('/tmp/login.html', 'w', encoding='utf-8') as f:
    with open('C:\\Users\\Shamim_pc\\Desktop\\dddd\\skynity\\hotspot-portal\\login.html', 'r', encoding='utf-8') as src:
        f.write(src.read())

with open('/tmp/style.css', 'w', encoding='utf-8') as f:
    with open('C:\\Users\\Shamim_pc\\Desktop\\dddd\\skynity\\hotspot-portal\\style.css', 'r', encoding='utf-8') as src:
        f.write(src.read())

sftp = client.open_sftp()
sftp.put('/tmp/login.html', '/srv/hotspot/login.html')
sftp.put('/tmp/style.css', '/srv/hotspot/style.css')
sftp.close()

# Verify
stdin, stdout, stderr = client.exec_command('ls -la /srv/hotspot/')
print(stdout.read().decode('utf-8', errors='replace'))

# 5. Restart PM2
print("\n=== 5. Restart PM2 ===")
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && pm2 restart all && pm2 save')
print(stdout.read().decode('utf-8', errors='replace'))

# 6. Quick test
print("\n=== 6. Quick Test ===")
stdin, stdout, stderr = client.exec_command('sleep 3 && curl -s -m 5 https://api.skynity.org/health')
print("API:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 5 -o /dev/null -w 'HTTP:%{http_code}' https://wifi.skynity.org/")
print("WiFi Portal:", stdout.read().decode('utf-8', errors='replace'))

client.close()
