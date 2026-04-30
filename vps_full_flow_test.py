import sys, paramiko, json, random
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

BASE_API = 'http://46.202.166.89:3001'

def curl(method, path, data=None, token=None):
    cmd = f"curl -s -m 15 -X {method}"
    if data:
        cmd += f" -H 'Content-Type: application/json' -d '{json.dumps(data)}'"
    if token:
        cmd += f" -H 'Authorization: Bearer {token}'"
    cmd += f" {BASE_API}{path}"
    stdin, stdout, stderr = client.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='replace').strip()

# 1. Admin login
print("=== 1. ADMIN LOGIN ===")
admin_login = json.loads(curl("POST", "/auth/login", {"email":"admin@skynity.net","password":"admin123"}))
admin_token = admin_login["data"]["accessToken"]
print("Admin:", admin_login["data"]["user"]["email"], "| role:", admin_login["data"]["user"]["role"])

# 2. Get packages
print("\n=== 2. GET PACKAGES ===")
pkgs = json.loads(curl("GET", "/packages", token=admin_token))
print(f"Found {len(pkgs['data'])} packages")
for p in pkgs["data"]:
    if not p.get("isTrial"):
        paid_pkg = p
        break
else:
    paid_pkg = pkgs["data"][0]
print(f"Using package: {paid_pkg['name']} ({paid_pkg['id']})")

# 3. Register customer (unique phone with only digits)
phone = f"017{random.randint(10000000, 99999999)}"
print(f"\n=== 3. REGISTER CUSTOMER ({phone}) ===")
reg_raw = curl("POST", "/portal-auth/register", {"phone":phone,"fullName":"E2E Test","password":"test123"})
print("Raw reg:", reg_raw[:500])
reg = json.loads(reg_raw)
if "data" not in reg:
    print("Registration failed:", reg)
    client.close()
    sys.exit(1)
customer = reg["data"]["customer"]
customer_token = reg["data"]["accessToken"]
print(f"Customer: {customer['fullName']} | Code: {customer['customerCode']} | ID: {customer['id']}")

# 4. Customer creates order
print("\n=== 4. CREATE ORDER ===")
order_data = {
    "packageId": paid_pkg["id"],
    "paymentMethod": "bkash",
    "trxId": "TRX" + str(random.randint(10000000, 99999999)),
    "paymentFrom": phone,
    "amountBdt": str(paid_pkg["priceBdt"])
}
order_resp = json.loads(curl("POST", "/portal-api/orders", data=order_data, token=customer_token))
print("Order response:", json.dumps(order_resp, indent=2)[:600])

# 5. Get orders (admin)
print("\n=== 5. GET ORDERS (admin) ===")
orders = json.loads(curl("GET", "/orders", token=admin_token))
print(f"Total orders: {len(orders['data'])}")
if orders["data"]:
    last_order = orders["data"][0]
    print(f"Latest order: ID={last_order['id']}, status={last_order['status']}, amount={last_order['amountBdt']}")

    # 6. Approve order
    print(f"\n=== 6. APPROVE ORDER {last_order['id']} ===")
    approve_raw = curl("POST", f"/orders/{last_order['id']}/approve", token=admin_token)
    print("Approve raw:", approve_raw[:800])
    approve = json.loads(approve_raw)
    print("Approve response:", json.dumps(approve, indent=2)[:800])

# 7. Check customer subscriptions
print("\n=== 7. CUSTOMER SUBSCRIPTIONS ===")
subs = json.loads(curl("GET", "/portal-api/subscriptions", token=customer_token))
print("Subscriptions:", json.dumps(subs, indent=2)[:800])

# 8. Check invoices
print("\n=== 8. INVOICES ===")
inv = json.loads(curl("GET", "/invoices", token=admin_token))
print(f"Total invoices: {len(inv['data'])}")
if inv["data"]:
    print(f"Latest invoice: {inv['data'][0]['invoiceNumber']} | amount={inv['data'][0]['totalBdt']}")

# 9. Monitoring routes
print("\n=== 9. MONITORING ROUTES ===")
print("Resource:", curl("GET", "/monitoring/resource", token=admin_token)[:200])
print("Bandwidth:", curl("GET", "/monitoring/bandwidth", token=admin_token)[:200])

client.close()
