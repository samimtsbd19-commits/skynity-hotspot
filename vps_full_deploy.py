import sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# 1. Pull
print("=== 1. Git Pull ===")
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && git fetch origin main && git reset --hard origin/main')
print(stdout.read().decode('utf-8', errors='replace'))

# 2. Install deps
print("\n=== 2. Install Dependencies ===")
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && pnpm install')
print(stdout.read().decode('utf-8', errors='replace')[-500:])

# 3. Upload hotspot portal
print("\n=== 3. Upload Hotspot Portal ===")
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

# 4. Seed packages
print("\n=== 4. Seed Packages ===")
seed_sql = """
UPDATE packages SET is_active = false WHERE is_trial = false;

INSERT INTO packages (org_id, name, type, download_mbps, upload_mbps, price_bdt, validity_days, is_trial, is_active, description, mikrotik_profile_name, radius_group_name)
VALUES
('056475e3-2139-4e66-8bc1-c1a16a5a98c4', '7 Day Free Trial', 'hotspot', 5, 5, 0.00, 7, true, true, '1 device', 'trial', 'trial-5m'),
('056475e3-2139-4e66-8bc1-c1a16a5a98c4', '5M Basic 15 Days', 'hotspot', 5, 5, 100.00, 15, false, true, '1 device', 'hotspot-daily', 'basic-5m'),
('056475e3-2139-4e66-8bc1-c1a16a5a98c4', '5M Duo 15 Days', 'hotspot', 5, 5, 150.00, 15, false, true, '2 devices', 'hotspot-daily', 'duo-5m'),
('056475e3-2139-4e66-8bc1-c1a16a5a98c4', '5M Basic 30 Days', 'hotspot', 5, 5, 150.00, 30, false, true, '1 device', 'hotspot-weekly', 'basic-5m-30d'),
('056475e3-2139-4e66-8bc1-c1a16a5a98c4', '5M Duo 30 Days', 'hotspot', 5, 5, 250.00, 30, false, true, '2 devices', 'hotspot-weekly', 'duo-5m-30d')
ON CONFLICT DO NOTHING;
"""
with open('/tmp/seed.sql', 'w', encoding='utf-8') as f:
    f.write(seed_sql)
sftp = client.open_sftp()
sftp.put('/tmp/seed.sql', '/tmp/seed.sql')
sftp.close()
stdin, stdout, stderr = client.exec_command('docker exec -i skynity-postgres psql -U skynity_user -d skynity < /tmp/seed.sql')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Verify packages
stdin, stdout, stderr = client.exec_command("docker exec skynity-postgres psql -U skynity_user -d skynity -c 'SELECT name, price_bdt, validity_days, is_trial, is_active FROM packages WHERE is_active = true ORDER BY is_trial DESC, price_bdt ASC;'")
print("Packages:", stdout.read().decode('utf-8', errors='replace'))

# 5. Restart
print("\n=== 5. Restart PM2 ===")
stdin, stdout, stderr = client.exec_command('cd /opt/skynity && pm2 restart all && pm2 save')
print(stdout.read().decode('utf-8', errors='replace'))

time.sleep(4)

# 6. Test
print("\n=== 6. Tests ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 5 https://api.skynity.org/health')
print("API:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 5 -o /dev/null -w 'HTTP:%{http_code}' https://wifi.skynity.org/")
print("WiFi:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command("curl -s -m 5 -o /dev/null -w 'HTTP:%{http_code}' https://user.skynity.org/portal/login")
print("Portal:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command('pm2 list')
print("PM2:\n", stdout.read().decode('utf-8', errors='replace'))

client.close()
