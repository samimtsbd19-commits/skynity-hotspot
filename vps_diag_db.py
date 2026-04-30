import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check actual column names in customers table
stdin, stdout, stderr = client.exec_command(
    'docker exec skynity-postgres psql -U skynity_user -d skynity -c "\\d customers"'
)
print("=== CUSTOMERS TABLE ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check all migrations
stdin, stdout, stderr = client.exec_command('ls -la /opt/skynity/apps/api/src/db/migrations/')
print("\n=== MIGRATIONS ===")
print(stdout.read().decode('utf-8', errors='replace'))

# Check customers schema
stdin, stdout, stderr = client.exec_command('grep -n -A5 -B5 "password" /opt/skynity/apps/api/src/db/schema/customers.ts')
print("\n=== CUSTOMERS SCHEMA ===")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
