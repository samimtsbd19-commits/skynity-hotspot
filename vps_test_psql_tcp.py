import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

# Test TCP connection to postgres with password
stdin, stdout, stderr = client.exec_command("PGPASSWORD='skynity_strong_pass_2026' psql -h localhost -U skynity_user -d skynity -c 'SELECT 1;' 2>&1")
out = stdout.read().decode('utf-8', errors='replace')
print('PSQL TCP TEST:', out)

# Check pg_hba.conf
stdin, stdout, stderr = client.exec_command("docker exec skynity-postgres cat /var/lib/postgresql/data/pg_hba.conf | grep -v '^#' | grep -v '^$' | head -10")
out = stdout.read().decode('utf-8', errors='replace')
print('PG_HBA:', out)

# Check actual postgres user password
stdin, stdout, stderr = client.exec_command("docker exec skynity-postgres psql -U skynity_user -d skynity -c \"SELECT rolname FROM pg_authid WHERE rolname='skynity_user';\" 2>&1")
out = stdout.read().decode('utf-8', errors='replace')
print('USERS:', out)

client.close()
