import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Check subscriptions table
print("=== SUBSCRIPTIONS TABLE ===")
stdin, stdout, stderr = client.exec_command(
    'docker exec skynity-postgres psql -U skynity_user -d skynity -c "\\d subscriptions"'
)
print(stdout.read().decode('utf-8', errors='replace'))

# Check orders table
print("\n=== ORDERS TABLE ===")
stdin, stdout, stderr = client.exec_command(
    'docker exec skynity-postgres psql -U skynity_user -d skynity -c "\\d orders"'
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(out if out else err)

# Check payment_configs table
print("\n=== PAYMENT_CONFIGS TABLE ===")
stdin, stdout, stderr = client.exec_command(
    'docker exec skynity-postgres psql -U skynity_user -d skynity -c "\\d payment_configs"'
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(out if out else err)

client.close()
