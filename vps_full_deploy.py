import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

vps = paramiko.SSHClient()
vps.set_missing_host_key_policy(paramiko.AutoAddPolicy())
vps.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
cd /opt/skynity
echo "=== Pulling latest code ==="
git reset --hard HEAD
git clean -fd
git pull origin main

echo "=== Installing dependencies ==="
pnpm install

echo "=== Running DB migration ==="
cd packages/db
npx drizzle-kit migrate

echo "=== Building ==="
cd /opt/skynity
pnpm build

echo "=== Restarting services ==="
pm2 restart ecosystem.config.js
pm2 save

echo "=== Done ==="
pm2 status
"""
stdin, stdout, stderr = vps.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")
for line in iter(stderr.readline, ""):
    print("ERR:", line, end="")

vps.close()
