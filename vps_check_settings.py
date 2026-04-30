import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImNjMzljOTEzLTcwM2QtNDk2Ny1hYzAzLTFmODI1NWI0MDgyOCIsImVtYWlsIjoiYWRtaW5Ac2t5bml0eS5uZXQiLCJyb2xlIjoic3VwZXJhZG1pbiIsIm9yZ0lkIjoiMDU2NDc1ZTMtMjEzOS00ZTY2LThiYzEtYzFhMTZhNWE5OGM0IiwiaWF0IjoxNzc3NTczNzA2LCJleHAiOjE3Nzc1NzQ2MDZ9.L3jpfFOD1XNHpQkibvGgW1pHWOONCqbG5uSO3L2lUvk'

stdin, stdout, stderr = client.exec_command(f"curl -s -m 5 -H 'Authorization: Bearer {TOKEN}' http://localhost:3001/settings/")
print('SETTINGS:', stdout.read().decode('utf-8', errors='replace')[:500])

stdin, stdout, stderr = client.exec_command(f"curl -s -m 5 -H 'Authorization: Bearer {TOKEN}' http://localhost:3001/settings/payments")
print('PAYMENTS:', stdout.read().decode('utf-8', errors='replace')[:500])

client.close()
