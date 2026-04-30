import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check API health with verbose
stdin, stdout, stderr = client.exec_command('curl -v http://localhost:3001/health 2>&1')
out = stdout.read().decode('utf-8', errors='replace')
print("=== API HEALTH ===")
print(out[-1500:] if len(out) > 1500 else out)

# Check web
stdin, stdout, stderr = client.exec_command('curl -v http://localhost:3000 2>&1 | head -30')
out = stdout.read().decode('utf-8', errors='replace')
print("\n=== WEB ===")
print(out)

# Check PM2 status
stdin, stdout, stderr = client.exec_command('pm2 list')
out = stdout.read().decode('utf-8', errors='replace')
print("\n=== PM2 ===")
print(out)

client.close()
