import sys, paramiko, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

BASE_API = 'http://46.202.166.89:3001'

def curl(method, path, data=None, token=None):
    cmd = f"curl -s -m 10 -X {method}"
    if data:
        cmd += f" -H 'Content-Type: application/json' -d '{json.dumps(data)}'"
    if token:
        cmd += f" -H 'Authorization: Bearer {token}'"
    cmd += f" {BASE_API}{path}"
    stdin, stdout, stderr = client.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='replace').strip()

print("1. REGISTER CUSTOMER")
reg = curl("POST", "/portal-auth/register", {
    "phone": "01712345678",
    "fullName": "Test Customer",
    "password": "test123"
})
print(reg[:500])

print("\n2. LOGIN CUSTOMER")
login = curl("POST", "/portal-auth/login", {
    "phone": "01712345678",
    "password": "test123"
})
print(login[:500])
try:
    customer_token = json.loads(login)["data"]["accessToken"]
except:
    customer_token = None

print("\n3. ADMIN LOGIN")
admin_login = curl("POST", "/auth/login", {
    "email": "admin@skynity.net",
    "password": "admin123"
})
try:
    admin_token = json.loads(admin_login)["data"]["accessToken"]
except:
    admin_token = None
print("Admin token:", "OK" if admin_token else "FAIL")

print("\n4. GET PACKAGES (customer)")
if customer_token:
    pkgs = curl("GET", "/portal-api/packages", token=customer_token)
    print(pkgs[:500])

print("\n5. GET PACKAGES (admin)")
if admin_token:
    pkgs = curl("GET", "/packages", token=admin_token)
    print(pkgs[:500])

print("\n6. GET BILLING/ORDERS (admin)")
if admin_token:
    orders = curl("GET", "/billing/orders", token=admin_token)
    print(orders[:500])

print("\n7. GET LIVE STATS")
stats = curl("GET", "/monitoring/live-stats")
print(stats[:500])

print("\n8. API INFO")
info = curl("GET", "/")
print(info[:500])

client.close()
