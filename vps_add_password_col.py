import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Add password_hash column to customers
stdin, stdout, stderr = client.exec_command(
    'docker exec skynity-postgres psql -U skynity_user -d skynity -c "ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"'
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("ALTER TABLE:", out.strip() if out else err.strip())

# Verify
stdin, stdout, stderr = client.exec_command(
    'docker exec skynity-postgres psql -U skynity_user -d skynity -c "\\d customers"'
)
print("\n=== CUSTOMERS TABLE AFTER FIX ===")
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
