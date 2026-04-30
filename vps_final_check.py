import sys, paramiko, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check invoices
print("=== INVOICES ===")
stdin, stdout, stderr = client.exec_command("curl -s -m 10 -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImNjMzljOTEzLTcwM2QtNDk2Ny1hYzAzLTFmODI1NWI0MDgyOCIsImVtYWlsIjoiYWRtaW5Ac2t5bml0eS5uZXQiLCJyb2xlIjoic3VwZXJhZG1pbiIsIm9yZ0lkIjoiMDU2NDc1ZTMtMjEzOS00ZTY2LThiYzEtYzFhMTZhNWE5OGM0IiwiaWF0IjoxNzc3NTczNzA2LCJleHAiOjE3Nzc1NzQ2MDZ9.L3jpfFOD1XNHpQkibvGgW1pHWOONCqbG5uSO3L2lUvk' http://46.202.166.89:3001/invoices")
print(stdout.read().decode('utf-8', errors='replace')[:500])

# Check public web
print("\n=== PUBLIC ACCESS ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 5 -o /dev/null -w "%{http_code}" http://46.202.166.89:3000/login')
print("Web login:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command('curl -s -m 5 -o /dev/null -w "%{http_code}" http://46.202.166.89:3000/portal/login')
print("Portal login:", stdout.read().decode('utf-8', errors='replace'))

stdin, stdout, stderr = client.exec_command('curl -s -m 5 -o /dev/null -w "%{http_code}" http://46.202.166.89:3001/health')
print("API health:", stdout.read().decode('utf-8', errors='replace'))

# Check PM2 status
print("\n=== PM2 STATUS ===")
stdin, stdout, stderr = client.exec_command('pm2 list')
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
