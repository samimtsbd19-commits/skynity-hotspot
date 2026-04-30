export interface RscConfigOptions {
  wanInterface: string;
  lanInterface: string;
  pppoeInterface?: string;
  hotspotInterface?: string;
  radiusServerIp: string;
  radiusSecret: string;
  pppoePoolName: string;
  pppoePoolRange: string;
  hotspotPoolName: string;
  hotspotPoolRange: string;
  hotspotAddress: string;
  hotspotProfileName: string;
}

export const defaultRscConfig: RscConfigOptions = {
  wanInterface: "ether1",
  lanInterface: "ether2",
  pppoeInterface: "ether2",
  hotspotInterface: "ether3",
  radiusServerIp: "10.100.0.1",
  radiusSecret: "skynity-radius-secret",
  pppoePoolName: "pppoe-pool",
  pppoePoolRange: "192.168.88.10-192.168.88.254",
  hotspotPoolName: "hotspot-pool",
  hotspotPoolRange: "192.168.89.10-192.168.89.254",
  hotspotAddress: "192.168.89.1/24",
  hotspotProfileName: "skynity-hotspot",
};

export function generatePppoeServerRsc(config: Partial<RscConfigOptions> = {}): string {
  const c = { ...defaultRscConfig, ...config };
  return `# SKYNITY PPPoE Server Configuration
# Generated automatically - Do NOT edit manually

# IP Pool for PPPoE
/ip pool add name=${c.pppoePoolName} ranges=${c.pppoePoolRange}

# PPP Profile with RADIUS
/ppp profile add name=skynity-pppoe local-address=192.168.88.1 remote-address=${c.pppoePoolName} use-encryption=yes use-compression=yes use-upnp=default change-tcp-mss=yes

# PPPoE Server
/interface pppoe-server server add interface=${c.pppoeInterface} service-name=SKYNITY-PPPoE max-mtu=1480 max-mru=1480 mrru=1600 authentication=pap,chap,mschap1,mschap2 keepalive-timeout=30 one-session-per-host=yes max-sessions=0 default-profile=skynity-pppoe

# RADIUS Configuration
/radius add service=ppp address=${c.radiusServerIp} secret=${c.radiusSecret} timeout=5000 retransmit=3
/radius incoming set accept=yes port=1700

# Enable PPPoE Server
/interface pppoe-server server enable [find service-name=SKYNITY-PPPoE]
`;
}

export function generateHotspotRsc(config: Partial<RscConfigOptions> = {}): string {
  const c = { ...defaultRscConfig, ...config };
  return `# SKYNITY Hotspot Configuration
# Generated automatically - Do NOT edit manually

# IP Pool for Hotspot
/ip pool add name=${c.hotspotPoolName} ranges=${c.hotspotPoolRange}

# Hotspot Profile
/ip hotspot profile add name=${c.hotspotProfileName} hotspot-address=${c.hotspotAddress.split("/")[0]} dns-name=login.skynity.net smtp-server=0.0.0.0 login-by=http-chap,trial use-radius=yes radius-accounting=yes radius-interim-update=5m nas-port-type=wireless-802.11

# Hotspot Server
/ip hotspot add name=${c.hotspotProfileName}-server interface=${c.hotspotInterface} address-pool=${c.hotspotPoolName} profile=${c.hotspotProfileName} addresses-per-mac=2 idle-timeout=5m keepalive-timeout=15m

# Hotspot RADIUS
/radius add service=hotspot address=${c.radiusServerIp} secret=${c.radiusSecret} timeout=5000 retransmit=3

# Walled Garden (allow portal access)
/ip hotspot walled-garden add dst-host=*.skynity.net action=allow
/ip hotspot walled-garden add dst-host=*bkash.com action=allow
/ip hotspot walled-garden add dst-host=*nagad.com.bd action=allow
`;
}

export function generateQueueTreeRsc(): string {
  return `# SKYNITY Queue Tree Configuration
# Generated automatically - Do NOT edit manually

# Simple Queue Templates - will be managed by SKYNITY API
/queue simple add name=trial-5m target=192.168.88.0/24 max-limit=5M/5M comment="SKYNITY-Trial"
/queue simple add name=home-basic target=192.168.88.0/24 max-limit=5M/10M comment="SKYNITY-HomeBasic"
/queue simple add name=home-plus target=192.168.88.0/24 max-limit=10M/20M comment="SKYNITY-HomePlus"
/queue simple add name=home-premium target=192.168.88.0/24 max-limit=15M/30M comment="SKYNITY-HomePremium"
/queue simple add name=business-50m target=192.168.88.0/24 max-limit=25M/50M comment="SKYNITY-Business50M"
/queue simple add name=hotspot-daily target=192.168.89.0/24 max-limit=5M/5M comment="SKYNITY-HotspotDaily"
/queue simple add name=hotspot-weekly target=192.168.89.0/24 max-limit=5M/5M comment="SKYNITY-HotspotWeekly"

# Parent Queue for WAN shaping
/queue simple add name=WAN-PARENT target=192.168.0.0/16 max-limit=900M/900M comment="SKYNITY-WAN-Parent"
`;
}

export function generateFirewallRsc(): string {
  return `# SKYNITY Firewall Configuration
# Generated automatically - Do NOT edit manually

# Address Lists for management
/ip firewall address-list add list=SKYNITY-MGMT address=192.168.88.0/24 comment="Management Network"
/ip firewall address-list add list=SKYNITY-BLOCKED comment="Blocked Users"

# Input Chain - Protect router
/ip firewall filter add chain=input action=accept connection-state=established,related comment="Accept Established"
/ip firewall filter add chain=input action=accept src-address-list=SKYNITY-MGMT comment="Accept Management"
/ip firewall filter add chain=input action=drop protocol=tcp dst-port=22,23,8291,8728,8729 comment="Block external management"
/ip firewall filter add chain=input action=accept comment="Accept all from LAN"

# Forward Chain - User traffic
/ip firewall filter add chain=forward action=accept connection-state=established,related comment="Accept Established"
/ip firewall filter add chain=forward action=drop src-address-list=SKYNITY-BLOCKED comment="Drop Blocked Users"
/ip firewall filter add chain=forward action=accept comment="Accept Forward"

# NAT Masquerade
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="SKYNITY-WAN-NAT"
`;
}

export function generateRadiusRsc(config: Partial<RscConfigOptions> = {}): string {
  const c = { ...defaultRscConfig, ...config };
  return `# SKYNITY RADIUS Configuration
# Generated automatically - Do NOT edit manually

# RADIUS Servers
/radius add service=ppp,hotspot address=${c.radiusServerIp} secret=${c.radiusSecret} timeout=5000 retransmit=3 backup=no

# RADIUS Incoming (CoA)
/radius incoming set accept=yes port=1700

# PPP AAA
/ppp aaa set use-radius=yes accounting=yes interim-update=5m default-group=skynity-pppoe
`;
}

export function generateFullRsc(config: Partial<RscConfigOptions> = {}): string {
  const c = { ...defaultRscConfig, ...config };
  return `# ==========================================
# SKYNITY ISP - Full Router Configuration
# Generated: ${new Date().toISOString()}
# ==========================================

${generateFirewallRsc()}

${generateRadiusRsc(c)}

${generatePppoeServerRsc(c)}

${generateHotspotRsc(c)}

${generateQueueTreeRsc()}

# System Identity
/system identity set name=SKYNITY-Core-Router

# NTP Client
/system ntp client set enabled=yes mode=unicast servers=0.bd.pool.ntp.org,1.bd.pool.ntp.org

# SNMP (for NMS)
/snmp community set [find name=public] addresses=::/0
/snmp set enabled=yes contact="admin@skynity.net" location="SKYNITY NOC"
`;
}

export function generateWireguardRsc(wgPort = 51820, wgPrivateKey: string, wgPublicKey: string, serverAddress = "10.200.0.1/24"): string {
  return `# SKYNITY WireGuard Tunnel Configuration
# Generated automatically - Do NOT edit manually

/interface wireguard add name=wg-skynity listen-port=${wgPort} mtu=1420 private-key="${wgPrivateKey}"
/interface wireguard peers add interface=wg-skynity public-key="${wgPublicKey}" endpoint-address=0.0.0.0 endpoint-port=${wgPort} allowed-address=10.200.0.2/32 comment="SKYNITY-VPS-Tunnel"
/ip address add address=${serverAddress} interface=wg-skynity comment="SKYNITY-WG"
`;
}
