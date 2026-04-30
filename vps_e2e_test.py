import sys, paramiko, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

BASE_API = 'http://46.202.166.89:3001'
BASE_WEB = 'http://46.202.166.89:3000'

def curl(method, path, data=None, token=None):
    cmd = f"curl -s -m 10 -X {method}"
    if data:
        cmd += f" -H 'Content-Type: application/json' -d '{json.dumps(data)}'"
    if token:
        cmd += f" -H 'Authorization: Bearer {token}'"
    cmd += f" {BASE_API}{path}"
    stdin, stdout, stderr = client.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='replace').strip()

print("1. PUBLIC API HEALTH")
print(curl("GET", "/health"))

print("\n2. ADMIN LOGIN")
login = curl("POST", "/auth/login", {"email":"admin@skynity.net","password":"admin123"})
print(login[:500])

print("\n3. PORTAL LOGIN (customer)")
portal = curl("POST", "/portal-auth/login", {"phone":"01712345678","password":"test123"})
print(portal[:500])

print("\n4. PUBLIC WEB HOME")
stdin, stdout, stderr = client.exec_command(f"curl -s -m 10 -o /dev/null -w '%{{http_code}}' {BASE_WEB}/")
print("HTTP:", stdout.read().decode('utf-8', errors='replace').strip())

print("\n5. PUBLIC WEB LOGIN PAGE")
stdin, stdout, stderr = client.exec_command(f"curl -s -m 10 -o /dev/null -w '%{{http_code}}' {BASE_WEB}/login")
print("HTTP:", stdout.read().decode('utf-8', errors='replace').strip())

client.close()
