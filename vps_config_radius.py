import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
set -e

echo "=== Check PostgreSQL RADIUS tables ==="
PGPASSWORD=skynity_strong_pass_2026 psql -h localhost -U skynity_user -d skynity -c "\\dt rad*" 2>/dev/null || echo "Tables may not exist"

echo "=== Create RADIUS tables if missing ==="
PGPASSWORD=skynity_strong_pass_2026 psql -h localhost -U skynity_user -d skynity -f /opt/skynity/infrastructure/radius/sql/schema.sql 2>/dev/null || echo "Schema may already exist"

echo "=== Backup original configs ==="
cp /etc/freeradius/3.0/clients.conf /etc/freeradius/3.0/clients.conf.bak.$(date +%s) 2>/dev/null || true
cp /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-available/sql.bak.$(date +%s) 2>/dev/null || true

echo "=== Configure clients.conf ==="
cat > /etc/freeradius/3.0/clients.conf << 'EOF'
client localhost {
    ipaddr = 127.0.0.1
    secret = radiussecret
    require_message_authenticator = no
    nas_type = other
}

client mikrotik {
    ipaddr = 10.100.0.2
    secret = radiussecret
    require_message_authenticator = no
    nas_type = mikrotik
}

client docker {
    ipaddr = 172.0.0.0/8
    secret = radiussecret
    require_message_authenticator = no
}
EOF

echo "=== Configure SQL module ==="
cat > /etc/freeradius/3.0/mods-available/sql << 'EOF'
sql {
    driver = "rlm_sql_postgresql"
    dialect = "postgresql"
    server = "localhost"
    port = 5432
    login = "skynity_user"
    password = "skynity_strong_pass_2026"
    radius_db = "skynity"
    pool {
        start = 5
        min = 5
        max = 32
        spare = 3
        uses = 0
        lifetime = 0
        cleanup_interval = 30
        idle_timeout = 60
    }
    acct_table1 = "radacct"
    acct_table2 = "radacct"
    postauth_table = "radpostauth"
    authcheck_table = "radcheck"
    authreply_table = "radreply"
    groupcheck_table = "radgroupcheck"
    groupreply_table = "radgroupreply"
    usergroup_table = "radusergroup"
    read_groups = yes
    delete_stale_sessions = yes
    group_attribute = "SQL-Group"
    log_file = "/var/log/freeradius/sqllog.sql"
    read_clients = no
}
EOF

echo "=== Enable SQL module ==="
ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql 2>/dev/null || true

echo "=== Enable SQL in default site ==="
sed -i 's/^#[[:space:]]*sql/sql/' /etc/freeradius/3.0/sites-available/default
sed -i 's/^[[:space:]]*-[[:space:]]*sql/#\t-sql/' /etc/freeradius/3.0/sites-available/default

echo "=== Set permissions ==="
chown -R freerad:freerad /etc/freeradius/3.0/
chmod 640 /etc/freeradius/3.0/mods-available/sql
chmod 640 /etc/freeradius/3.0/clients.conf

echo "=== Test config ==="
freeradius -C || echo "Config test failed"

echo "=== Restart FreeRADIUS ==="
systemctl restart freeradius
systemctl enable freeradius
systemctl status freeradius --no-pager

echo "=== Check ports ==="
ss -tlnp | grep -E "1812|1813" || netstat -tlnp 2>/dev/null | grep -E "1812|1813" || echo "Port check done"
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

err = stderr.read().decode('utf-8', errors='replace')
if err.strip():
    print("STDERR:", err)

client.close()
