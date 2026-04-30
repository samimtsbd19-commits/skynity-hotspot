import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check line endings
stdin, stdout, stderr = client.exec_command("cat /opt/skynity/.env | grep POSTGRES_PASSWORD | xxd | head -3")
out = stdout.read().decode('utf-8', errors='replace')
print('HEX DUMP:', out)

# Check if psql works with the exact password from .env
stdin, stdout, stderr = client.exec_command("PASS=$(grep POSTGRES_PASSWORD /opt/skynity/.env | cut -d= -f2 | tr -d '\\r'); echo \"Password length: ${#PASS}\"; docker exec skynity-postgres psql -U skynity_user -d skynity -c 'SELECT 1;' 2>&1 || echo 'psql failed'")
out = stdout.read().decode('utf-8', errors='replace')
print('PSQL TEST:', out)

# Fix .env file - convert CRLF to LF
stdin, stdout, stderr = client.exec_command("sed -i 's/\\r$//' /opt/skynity/.env && echo 'Fixed CRLF'")
out = stdout.read().decode('utf-8', errors='replace')
print('FIX:', out)

# Verify fix
stdin, stdout, stderr = client.exec_command("cat /opt/skynity/.env | grep POSTGRES_PASSWORD | xxd | head -2")
out = stdout.read().decode('utf-8', errors='replace')
print('HEX AFTER FIX:', out)

client.close()
