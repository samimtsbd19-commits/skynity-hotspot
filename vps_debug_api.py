import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check what env vars the API process actually has
stdin, stdout, stderr = client.exec_command("cat /proc/$(pgrep -f 'cli.mjs' | head -1)/environ 2>/dev/null | tr '\\0' '\\n' | grep -E 'DATABASE|POSTGRES|PORT' | sort || echo 'no proc found'")
out = stdout.read().decode('utf-8', errors='replace')
print('API PROC ENV:', out)

# Also check with node directly using the same env
stdin, stdout, stderr = client.exec_command("cd /opt/skynity/apps/api && node -e \"require('dotenv').config({path:'../../.env'}); console.log('DB_URL:', process.env.DATABASE_URL); console.log('PWD:', process.env.POSTGRES_PASSWORD);\"")
out = stdout.read().decode('utf-8', errors='replace')
print('DOTENV TEST 2:', out)

# Try connecting with node-pg directly
stdin, stdout, stderr = client.exec_command("cd /opt/skynity/apps/api && node -e \"require('dotenv').config({path:'../../.env'}); const {Pool} = require('pg'); const p = new Pool({connectionString: process.env.DATABASE_URL}); p.query('SELECT 1').then(r => console.log('OK:', r.rows[0])).catch(e => console.log('ERR:', e.message));\"")
out = stdout.read().decode('utf-8', errors='replace')
print('PG TEST:', out)

client.close()
