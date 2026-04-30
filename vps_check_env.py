import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check env vars in PM2 process
stdin, stdout, stderr = client.exec_command("cat /proc/$(pgrep -f 'cli.mjs')/environ 2>/dev/null | tr '\\0' '\\n' | grep -E '^(DATABASE_URL|POSTGRES_PASSWORD|NODE_ENV)=' || echo 'could not read proc env'")
out = stdout.read().decode('utf-8', errors='replace')
print('PM2 PROC ENV:', out)

# Check if pm2 has cached env
stdin, stdout, stderr = client.exec_command("pm2 env skynity-api 2>/dev/null | grep -E 'DATABASE_URL|POSTGRES_PASSWORD' || echo 'no cached env'")
out = stdout.read().decode('utf-8', errors='replace')
print('PM2 CACHED ENV:', out)

# Test with direct node execution (not through PM2)
stdin, stdout, stderr = client.exec_command("cd /opt/skynity/apps/api && node -e \"require('dotenv').config({path:'../../.env'}); console.log('DB_URL from dotenv:', process.env.DATABASE_URL);\"")
out = stdout.read().decode('utf-8', errors='replace')
print('DIRECT NODE:', out)

# Quick fix: delete and recreate PM2 processes
stdin, stdout, stderr = client.exec_command('pm2 delete all 2>/dev/null; cd /opt/skynity && pm2 start ecosystem.config.js && sleep 3')
out = stdout.read().decode('utf-8', errors='replace')
print('RECREATE:', out)

client.close()
