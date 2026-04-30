import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Test dotenv loading
stdin, stdout, stderr = client.exec_command("cd /opt/skynity/apps/api && node -e \"require('dotenv').config({path:'../../.env'}); console.log('DATABASE_URL:', process.env.DATABASE_URL); console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD);\"")
out = stdout.read().decode('utf-8', errors='replace')
print('DOTENV TEST:', out)

# Also test absolute path
stdin, stdout, stderr = client.exec_command("node -e \"require('dotenv').config({path:'/opt/skynity/.env'}); console.log('DATABASE_URL:', process.env.DATABASE_URL);\"")
out = stdout.read().decode('utf-8', errors='replace')
print('ABS PATH TEST:', out)

# Check the actual env file content with hex dump of first/last chars
stdin, stdout, stderr = client.exec_command("cat /opt/skynity/.env | head -5 && echo '---' && wc -l /opt/skynity/.env")
out = stdout.read().decode('utf-8', errors='replace')
print('ENV FILE:', out)

client.close()
