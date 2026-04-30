import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.166.89', username='root', password='-j5&3DlPQkEtdGiO', timeout=15)

def run(cmd, print_output=True):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if print_output and out:
        print(out)
    if print_output and err:
        print('ERR:', err)
    return out, err

# Check existing processes and services
print("=== Checking existing services ===")
run('ps aux | grep -E "(node|next|fastify|postgres)" | grep -v grep || echo "No existing Node/Postgres processes"')
run('ls -la /opt/ /var/www/ /root/ 2>/dev/null | head -30')
run('docker ps -a 2>/dev/null || echo "No docker containers"')

client.close()
