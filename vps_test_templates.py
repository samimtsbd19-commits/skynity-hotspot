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

# 1. Admin login
print("=== 1. ADMIN LOGIN ===")
admin = json.loads(curl("POST", "/auth/login", {"email":"admin@skynity.net","password":"admin123"}))
admin_token = admin["data"]["accessToken"]
print("OK")

# 2. Get packages (check templateConfig)
print("\n=== 2. PACKAGES (with templateConfig) ===")
pkgs = json.loads(curl("GET", "/packages", token=admin_token))
for p in pkgs.get("data", []):
    tc = p.get("templateConfig") or {}
    print(f"  {p['name']}: trial={p['isTrial']} | template={tc.get('cardStyle','none')} | color={tc.get('primaryColor','none')}")

# 3. Update a package template
if pkgs.get("data"):
    pkg = pkgs["data"][0]
    print(f"\n=== 3. UPDATE TEMPLATE for {pkg['name']} ===")
    template = {
        "primaryColor": "#FF8C00",
        "secondaryColor": "#FF3B6B",
        "accentColor": "#FFD700",
        "bgGradient": "from-[#1a0a00] to-[#2d0f0f]",
        "cardStyle": "solid",
        "badgeStyle": "rounded",
        "fontFamily": "inter"
    }
    update = curl("PUT", f"/packages/{pkg['id']}", {"templateConfig": template}, admin_token)
    print("Update:", update[:200])

# 4. Free trial signup
import random
phone = f"017{random.randint(10000000, 99999999)}"
print(f"\n=== 4. FREE TRIAL ({phone}) ===")
trial = curl("POST", "/portal-auth/free-trial", {"fullName":"Trial Test","phone":phone,"password":"test123"})
print("Trial:", trial[:500])

# 5. Check portal packages include templateConfig
print("\n=== 5. PORTAL PACKAGES ===")
portal_pkgs = json.loads(curl("GET", "/portal-api/packages"))
for p in portal_pkgs.get("data", []):
    tc = p.get("templateConfig") or {}
    print(f"  {p['name']}: price={p['priceBdt']} | template={tc.get('cardStyle','none')}")

# 6. WiFi portal HTML check
print("\n=== 6. WIFI PORTAL ===")
stdin, stdout, stderr = client.exec_command("curl -s -m 5 https://wifi.skynity.org/ | grep -o '<title>.*</title>'")
print("Title:", stdout.read().decode('utf-8', errors='replace').strip())

stdin, stdout, stderr = client.exec_command("curl -s -m 5 https://wifi.skynity.org/ | grep -c 'package-card'")
print("Package cards found:", stdout.read().decode('utf-8', errors='replace').strip())

# 7. Check trial package exists
print("\n=== 7. TRIAL PACKAGE CHECK ===")
trial_pkgs = [p for p in portal_pkgs.get("data", []) if p.get("isTrial")]
print(f"Trial packages: {len(trial_pkgs)}")
for t in trial_pkgs:
    print(f"  {t['name']} | {t['validityDays']} days | {t['priceBdt']} BDT")

client.close()
