import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Test admin login
stdin, stdout, stderr = client.exec_command("curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@skynity.net\",\"password\":\"admin123\"}'")
out = stdout.read().decode('utf-8', errors='replace')
print('LOGIN:', out[:200])

# Test portal packages (public)
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3001/portal-api/packages")
out = stdout.read().decode('utf-8', errors='replace')
print('PACKAGES:', out[:200])

# Test health
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3001/health")
out = stdout.read().decode('utf-8', errors='replace')
print('HEALTH:', out)

client.close()
