import paramiko, json, sys
sys.stdout.reconfigure(encoding='utf-8')

vps = paramiko.SSHClient()
vps.set_missing_host_key_policy(paramiko.AutoAddPolicy())
vps.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
# Test MikroTik REST API via port 80 (HTTP)
MIKROTIK_HOST="192.168.1.213"
MIKROTIK_USER="admin"
MIKROTIK_PASS="4251"

echo "=== Test 1: GET /rest/system/resource ==="
curl -s -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/system/resource" | head -c 500

echo ""
echo ""
echo "=== Test 2: GET /rest/ppp/secret ==="
curl -s -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/ppp/secret" | head -c 500

echo ""
echo ""
echo "=== Test 3: GET /rest/ip/hotspot/user ==="
curl -s -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/ip/hotspot/user" | head -c 500

echo ""
echo ""
echo "=== Test 4: GET /rest/interface ==="
curl -s -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/interface" | head -c 500

echo ""
echo ""
echo "=== Test 5: GET /rest/queue/simple ==="
curl -s -u "$MIKROTIK_USER:$MIKROTIK_PASS" "http://$MIKROTIK_HOST:80/rest/queue/simple" | head -c 500

echo ""
"""
stdin, stdout, stderr = vps.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")
vps.close()
