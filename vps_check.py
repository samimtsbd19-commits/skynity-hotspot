import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

commands = [
    'echo "=== OS ===" && cat /etc/os-release | grep -E "^(NAME|VERSION|ID)"',
    'echo "=== Docker ===" && docker --version && docker compose version',
    'echo "=== Node ===" && node --version && npm --version',
    'echo "=== pnpm ===" && pnpm --version',
    'echo "=== Git ===" && git --version',
    'echo "=== Nginx ===" && nginx -v 2>&1 || echo "nginx not found"',
    'echo "=== PM2 ===" && pm2 --version || echo "pm2 not found"',
    'echo "=== Ports ===" && ss -tlnp | grep -E ":(80|443|3000|3001|5432|6379)" || echo "ss not available"',
    'echo "=== Disk ===" && df -h /',
    'echo "=== RAM ===" && free -h',
]

for cmd in commands:
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err and 'not found' not in err.lower():
        print('ERR:', err)
    print()

client.close()
