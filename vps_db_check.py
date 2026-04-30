import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check postgres container
stdin, stdout, stderr = client.exec_command('docker ps | grep postgres && docker logs skynity-postgres --tail 10')
out = stdout.read().decode('utf-8', errors='replace')
print('POSTGRES:', out)

# Check .env file
stdin, stdout, stderr = client.exec_command('cat /opt/skynity/.env | grep -E "(DATABASE_URL|POSTGRES_PASSWORD)"')
out = stdout.read().decode('utf-8', errors='replace')
print('ENV:', out)

# Try direct psql connection
stdin, stdout, stderr = client.exec_command('docker exec skynity-postgres psql -U skynity_user -d skynity -c "SELECT 1;" 2>&1')
out = stdout.read().decode('utf-8', errors='replace')
print('PSQL:', out)

client.close()
