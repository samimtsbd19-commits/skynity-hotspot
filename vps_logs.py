import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check API error logs
stdin, stdout, stderr = client.exec_command('pm2 logs skynity-api --lines 30 --nostream 2>&1 | tail -40')
out = stdout.read().decode('utf-8', errors='replace')
print("=== API LOGS ===")
print(out)

# Check Web error logs
stdin, stdout, stderr = client.exec_command('pm2 logs skynity-web --lines 30 --nostream 2>&1 | tail -40')
out = stdout.read().decode('utf-8', errors='replace')
print("\n=== WEB LOGS ===")
print(out)

client.close()
