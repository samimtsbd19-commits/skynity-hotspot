import sys, paramiko, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

API = 'https://api.skynity.org'

def curl(method, path, data=None, token=None):
    cmd = f"curl -s -m 15 -X {method}"
    if data:
        cmd += f" -H 'Content-Type: application/json' -d '{json.dumps(data)}'"
    if token:
        cmd += f" -H 'Authorization: Bearer {token}'"
    cmd += f" {API}{path}"
    stdin, stdout, stderr = client.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='replace').strip()

# Portal login via user domain test (using API)
print("=== Portal Login (existing customer) ===")
login = json.loads(curl("POST", "/portal-auth/login", {"phone":"01785980774","password":"test123"}))
print("Login:", "OK" if "data" in login else login.get("error", "FAIL"))

token = login.get("data", {}).get("accessToken")

if token:
    print("\n=== Customer Packages ===")
    pkgs = json.loads(curl("GET", "/portal-api/packages", token=token))
    print(f"Found {len(pkgs.get('data', []))} packages")

    print("\n=== Customer Subscriptions ===")
    subs = json.loads(curl("GET", "/portal-api/subscriptions", token=token))
    print(f"Found {len(subs.get('data', []))} subscriptions")
    for s in subs.get('data', []):
        print(f"  - {s['username']} | {s['status']} | expires: {s['expiresAt'][:10]}")

    print("\n=== Customer Orders ===")
    orders = json.loads(curl("GET", "/portal-api/orders", token=token))
    print(f"Found {len(orders.get('data', []))} orders")

# Test user.skynity.org web pages
print("\n=== Web Page Tests via user.skynity.org ===")
for path in ['/portal/login', '/portal/packages', '/portal/orders']:
    stdin, stdout, stderr = client.exec_command(f"curl -s -m 10 -o /dev/null -w 'HTTP:%{{http_code}}' https://user.skynity.org{path}")
    print(f"  {path}: {stdout.read().decode('utf-8', errors='replace')}")

client.close()
