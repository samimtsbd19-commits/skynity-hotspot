import sys, paramiko, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Get fresh token
stdin, stdout, stderr = client.exec_command("curl -s -m 5 -X POST -H 'Content-Type: application/json' -d '{\"email\":\"admin@skynity.net\",\"password\":\"admin123\"}' http://localhost:3001/auth/login")
login = json.loads(stdout.read().decode('utf-8', errors='replace'))
token = login["data"]["accessToken"]
print("TOKEN OK")

stdin, stdout, stderr = client.exec_command(f"curl -s -m 5 -H 'Authorization: Bearer {token}' http://localhost:3001/settings/")
print('SETTINGS:', stdout.read().decode('utf-8', errors='replace')[:800])

stdin, stdout, stderr = client.exec_command(f"curl -s -m 5 -H 'Authorization: Bearer {token}' http://localhost:3001/settings/payments")
print('PAYMENTS:', stdout.read().decode('utf-8', errors='replace')[:800])

client.close()
