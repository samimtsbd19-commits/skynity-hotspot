import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8')

vps = paramiko.SSHClient()
vps.set_missing_host_key_policy(paramiko.AutoAddPolicy())
vps.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

# Test the API health and MikroTik connectivity
cmd = """
echo "=== API Health ==="
curl -s --max-time 10 http://localhost:3001/health

echo ""
echo "=== Test MikroTik via API ==="
curl -s --max-time 15 http://localhost:3001/monitoring/resource/ \
  -H "Authorization: Bearer test" || echo "Auth required - expected"

echo ""
echo "=== PM2 Logs (last 20 lines) ==="
pm2 logs skynity-api --lines 20 --nostream
"""
stdin, stdout, stderr = vps.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

vps.close()
