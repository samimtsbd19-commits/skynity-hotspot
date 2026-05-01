import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.213', username='admin', password='4251', timeout=15)

def run_cmd(cmd):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err:
        print(f"ERR: {err}")
    return out, err

# Fix NAT (no place-before needed for empty table)
run_cmd("ip firewall nat remove [find comment=WAN-NAT]")
run_cmd("ip firewall nat add chain=srcnat out-interface=ether1-WAN action=masquerade comment=WAN-NAT")

# Fix PPP profile first, then PPPoE server
run_cmd("ppp profile remove [find name=skynity-pppoe]")
run_cmd('ppp profile add name=skynity-pppoe local-address=10.30.0.1 remote-address=pppoe-pool use-encryption=yes change-tcp-mss=yes')

# Remove existing PPPoE server and re-add
run_cmd("interface pppoe-server server remove [find interface=ether3-PPPoE]")
run_cmd('interface pppoe-server server add service-name=SKYNITY-PPPoE interface=ether3-PPPoE max-mtu=1480 max-mru=1480 authentication=pap,chap,mschap1,mschap2 keepalive-timeout=30 one-session-per-host=yes default-profile=skynity-pppoe disabled=no')

# Fix Hotspot profile (simpler syntax)
run_cmd("ip hotspot profile remove [find name=skynity-hotspot]")
run_cmd('ip hotspot profile add name=skynity-hotspot hotspot-address=10.20.0.1 dns-name=wifi.skynity.org html-directory=flash/hotspot login-by=http-chap,radius use-radius=yes radius-accounting=yes')

# Remove and re-add hotspot server
run_cmd("ip hotspot remove [find name=hotspot1]")
run_cmd("ip hotspot add name=hotspot1 interface=ether2-Hotspot profile=skynity-hotspot addresses-per-mac=2 disabled=no")

# Fix firewall rules (no place-before for empty table)
run_cmd("ip firewall filter remove [find comment~=SKYNITY]")

run_cmd("ip firewall filter add chain=input connection-state=established,related action=accept comment=SKYNITY-Allow-Established")
run_cmd("ip firewall filter add chain=forward connection-state=established,related action=accept comment=SKYNITY-Allow-Est-Forward")
run_cmd("ip firewall filter add chain=input in-interface=ether2-Hotspot action=accept comment=SKYNITY-Allow-Hotspot")
run_cmd("ip firewall filter add chain=input in-interface=ether3-PPPoE action=accept comment=SKYNITY-Allow-PPPoE")
run_cmd("ip firewall filter add chain=input in-interface=ether5-Admin action=accept comment=SKYNITY-Allow-LAN")
run_cmd("ip firewall filter add chain=input in-interface=wg-skynity action=accept comment=SKYNITY-Allow-WG")
run_cmd("ip firewall filter add chain=input protocol=tcp dst-port=22,8291,8729 src-address-list=admin-access action=accept comment=SKYNITY-Allow-Admin")
run_cmd("ip firewall filter add chain=input connection-state=invalid action=drop comment=SKYNITY-Drop-Invalid")
run_cmd("ip firewall filter add chain=forward connection-state=invalid action=drop comment=SKYNITY-Drop-Inv-Forward")
run_cmd("ip firewall filter add chain=input in-interface=ether1-WAN action=drop comment=SKYNITY-Drop-WAN")

print("\n=== MikroTik Fix Complete ===")
client.close()
