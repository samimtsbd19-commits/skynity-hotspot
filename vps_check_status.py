import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

print("=== PM2 STATUS ===")
stdin, stdout, stderr = client.exec_command('pm2 list')
print(stdout.read().decode('utf-8', errors='replace'))

print("=== PORTS ===")
stdin, stdout, stderr = client.exec_command('ss -tlnp | grep -E ":300[01]"')
print(stdout.read().decode('utf-8', errors='replace'))

print("=== API HEALTH ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 5 http://localhost:3001/health')
print(stdout.read().decode('utf-8', errors='replace'))

print("=== WEB HOME ===")
stdin, stdout, stderr = client.exec_command('curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:3000')
print(stdout.read().decode('utf-8', errors='replace'))

print("=== API DB TEST (direct pg) ===")
script = '''node -e "const {Client}=require('/opt/skynity/apps/api/node_modules/pg');const c=new Client({connectionString:'postgres://skynity_user:skynity_strong_pass_2026@localhost:5432/skynity'});c.connect().then(()=>c.query('SELECT 1 as ok')).then(r=>console.log('DB OK:',r.rows[0])).catch(e=>console.log('DB FAIL:',e.message)).finally(()=>c.end())"
'''
stdin, stdout, stderr = client.exec_command(script)
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
