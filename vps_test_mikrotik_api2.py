import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

vps = paramiko.SSHClient()
vps.set_missing_host_key_policy(paramiko.AutoAddPolicy())
vps.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
MIKROTIK_HOST="10.100.0.2"
MIKROTIK_USER="admin"
MIKROTIK_PASS="4251"

echo "=== Test 1: GET /rest/system/resource ==="
curl -s --max-time 10 -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/system/resource"

echo ""
echo "=== Test 2: GET /rest/ppp/secret ==="
curl -s --max-time 10 -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/ppp/secret" | head -c 300

echo ""
echo "=== Test 3: GET /rest/interface ==="
curl -s --max-time 10 -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/interface" | head -c 300

echo ""
"""
stdin, stdout, stderr = vps.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")
vps.close()
