import paramiko
import sys
import time

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
    if err and "expected end of command" not in err.lower() and "nothing" not in err.lower():
        print(f"ERR: {err}")
    return out, err

# 1. Set identity
run_cmd("system identity set name=SKYNITY-Core-Router")

# 2. Update RADIUS secret
run_cmd("radius remove [find address=10.100.0.1]")
run_cmd("radius add service=ppp,hotspot address=10.100.0.1 secret=radiussecret authentication-port=1812 accounting-port=1813 timeout=5s")

# 3. Enable RADIUS incoming (for CoA - change of authorization)
run_cmd("radius incoming set accept=yes port=3799")

# 4. Setup NAT masquerade for WAN
run_cmd("ip firewall nat add chain=srcnat out-interface=ether1-WAN action=masquerade comment=WAN-NAT place-before=0")

# 5. Setup IP addresses for local networks
# First remove any existing addresses on these interfaces (except WAN and wg)
run_cmd("ip address remove [find interface=ether2-Hotspot]")
run_cmd("ip address remove [find interface=ether3-PPPoE]")
run_cmd("ip address remove [find interface=ether4-LAN]")
run_cmd("ip address remove [find interface=ether5-Admin]")

run_cmd("ip address add address=10.20.0.1/24 interface=ether2-Hotspot comment=Hotspot-Gateway")
run_cmd("ip address add address=10.30.0.1/24 interface=ether3-PPPoE comment=PPPoE-Gateway")
run_cmd("ip address add address=10.50.0.1/24 interface=ether5-Admin comment=LAN-PC-Gateway")

# 6. Create IP Pools
run_cmd("ip pool add name=hotspot-pool ranges=10.20.0.10-10.20.0.254 comment=Hotspot-Users")
run_cmd("ip pool add name=pppoe-pool ranges=10.30.0.10-10.30.0.254 comment=PPPoE-Users")
run_cmd("ip pool add name=lan-pool ranges=10.50.0.10-10.50.0.254 comment=LAN-PC-Users")

# 7. Setup DHCP Server for LAN (ether5)
run_cmd("ip dhcp-server network remove [find comment=LAN-DHCP]")
run_cmd("ip dhcp-server remove [find name=lan-dhcp]")
run_cmd("ip dhcp-server add name=lan-dhcp interface=ether5-Admin address-pool=lan-pool lease-time=1d disabled=no comment=LAN-DHCP")
run_cmd("ip dhcp-server network add address=10.50.0.0/24 gateway=10.50.0.1 dns-server=8.8.8.8,1.1.1.1 comment=LAN-DHCP")

# 8. Setup Hotspot on ether2
# Remove existing hotspot configs first
run_cmd("ip hotspot remove [find name=hotspot1]")
run_cmd("ip hotspot profile remove [find name=skynity-hotspot]")
run_cmd("ip hotspot user profile remove [find name=default]")

# Create hotspot profile
run_cmd('ip hotspot profile add name=skynity-hotspot hotspot-address=10.20.0.1 dns-name=wifi.skynity.org html-directory=flash/hotspot smtp-server=0.0.0.0 login-by=http-chap,radius radius-accounting=yes radius-interim-update=5m use-radius=yes')

# Create hotspot server
run_cmd("ip hotspot add name=hotspot1 interface=ether2-Hotspot profile=skynity-hotspot addresses-per-mac=2 idle-timeout=5m keepalive-timeout=15m disabled=no")

# 9. Setup PPPoE Server on ether3
# Remove existing PPPoE server
run_cmd("interface pppoe-server server remove [find interface=ether3-PPPoE]")

# Create PPPoE server
run_cmd("interface pppoe-server server add service-name=SKYNITY-PPPoE interface=ether3-PPPoE max-mtu=1480 max-mru=1480 mrru=disabled authentication=pap,chap,mschap1,mschap2 keepalive-timeout=30 one-session-per-host=yes max-sessions=0 default-profile=skynity-pppoe disabled=no")

# Create PPP profile
run_cmd("ppp profile remove [find name=skynity-pppoe]")
run_cmd('ppp profile add name=skynity-pppoe local-address=10.30.0.1 remote-address=pppoe-pool use-encryption=yes use-upnp=default change-tcp-mss=yes use-compression=no use-mpls=no')

# 10. Setup basic firewall rules
# Allow established/related
run_cmd("ip firewall filter add chain=input connection-state=established,related action=accept comment=Allow-Established place-before=0")
run_cmd("ip firewall filter add chain=forward connection-state=established,related action=accept comment=Allow-Established-Forward place-before=0")

# Allow internal traffic
run_cmd("ip firewall filter add chain=input in-interface=ether2-Hotspot action=accept comment=Allow-Hotspot-Input place-before=0")
run_cmd("ip firewall filter add chain=input in-interface=ether3-PPPoE action=accept comment=Allow-PPPoE-Input place-before=0")
run_cmd("ip firewall filter add chain=input in-interface=ether5-Admin action=accept comment=Allow-LAN-Input place-before=0")
run_cmd("ip firewall filter add chain=input in-interface=wg-skynity action=accept comment=Allow-WireGuard-Input place-before=0")

# Allow Winbox, SSH, API from LAN and WireGuard
run_cmd("ip firewall filter add chain=input protocol=tcp dst-port=22,8291,8728,8729 src-address-list=admin-access action=accept comment=Allow-Admin-Access place-before=0")
run_cmd("ip firewall address-list remove [find list=admin-access]")
run_cmd("ip firewall address-list add list=admin-access address=10.50.0.0/24 comment=LAN-Admin")
run_cmd("ip firewall address-list add list=admin-access address=10.100.0.0/24 comment=WireGuard-Admin")
run_cmd("ip firewall address-list add list=admin-access address=192.168.1.0/24 comment=WAN-Local-Admin")

# Drop invalid
run_cmd("ip firewall filter add chain=input connection-state=invalid action=drop comment=Drop-Invalid place-before=0")
run_cmd("ip firewall filter add chain=forward connection-state=invalid action=drop comment=Drop-Invalid-Forward place-before=0")

# Drop everything else from WAN
run_cmd("ip firewall filter add chain=input in-interface=ether1-WAN action=drop comment=Drop-WAN-Input place-before=0")

# 11. Setup DNS to allow remote requests for hotspot
run_cmd("ip dns set allow-remote-requests=yes servers=8.8.8.8,1.1.1.1")

# 12. Enable API-SSL service and disable plain API (security)
run_cmd("ip service set api disabled=yes")
run_cmd("ip service set api-ssl disabled=no port=8729")

print("\n=== MikroTik Configuration Complete ===")
client.close()
