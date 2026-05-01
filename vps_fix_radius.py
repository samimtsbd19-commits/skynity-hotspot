import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password="xpHc;haRnLWeIv9'4nN@", timeout=15)

cmd = """
set -e

echo "=== Fix default site ==="
# Comment out sqlippool references
sed -i 's/^[[:space:]]*sqlippool[[:space:]]*$/\t#sqlippool/' /etc/freeradius/3.0/sites-available/default
sed -i 's/^[[:space:]]*sql_session_start[[:space:]]*$/\t#sql_session_start/' /etc/freeradius/3.0/sites-available/default

# Make sure sql is enabled in authorize, accounting, post-auth
# In authorize section: uncomment -sql  
sed -i '/authorize {/,/}/s/^#[[:space:]]*-sql/\t-sql/' /etc/freeradius/3.0/sites-available/default

# In accounting section: uncomment -sql
sed -i '/accounting {/,/}/s/^#[[:space:]]*-sql/\t-sql/' /etc/freeradius/3.0/sites-available/default

# In post-auth section: uncomment -sql
sed -i '/post-auth {/,/}/s/^#[[:space:]]*-sql/\t-sql/' /etc/freeradius/3.0/sites-available/default

# In session section: uncomment sql
sed -i '/session {/,/}/s/^#[[:space:]]*sql/\tsql/' /etc/freeradius/3.0/sites-available/default

echo "=== Fix inner-tunnel site ==="
sed -i 's/^[[:space:]]*sqlippool[[:space:]]*$/\t#sqlippool/' /etc/freeradius/3.0/sites-available/inner-tunnel
sed -i '/authorize {/,/}/s/^#[[:space:]]*-sql/\t-sql/' /etc/freeradius/3.0/sites-available/inner-tunnel
sed -i '/post-auth {/,/}/s/^#[[:space:]]*-sql/\t-sql/' /etc/freeradius/3.0/sites-available/inner-tunnel

echo "=== Remove conflicting modules ==="
rm -f /etc/freeradius/3.0/mods-enabled/ldap 2>/dev/null || true

echo "=== Test config ==="
freeradius -C

echo "=== Restart ==="
systemctl restart freeradius
sleep 2
systemctl status freeradius --no-pager

echo "=== Test RADIUS locally ==="
echo "User-Name=admin,User-Password=test" | radtest admin test 127.0.0.1 0 radiussecret 2>/dev/null || echo "radtest done"
"""
stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    print(line, end="")

client.close()
