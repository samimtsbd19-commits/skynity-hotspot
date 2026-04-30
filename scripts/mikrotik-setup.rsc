# SKYNITY MikroTik Setup Script
# Replace placeholders before importing

/interface wireguard add name=wg-skynity private-key="[GENERATED]"
/interface wireguard peers add \
  interface=wg-skynity \
  public-key="[VPS_PUBLIC_KEY]" \
  endpoint-address="[VPS_IP]" \
  endpoint-port=51820 \
  allowed-address=10.100.0.1/32 \
  persistent-keepalive=25

/ip address add address=10.100.0.2/24 interface=wg-skynity
/ip route add dst-address=10.100.0.0/24 gateway=wg-skynity

/radius add address=10.100.0.1 secret="[RADIUS_SECRET]" service=ppp,hotspot
/ppp aaa set use-radius=yes accounting=yes
/ip hotspot profile set [find name=hsprof1] use-radius=yes

/ip service set api disabled=no port=8728
/ip service set api-ssl disabled=no port=8729

/ppp profile add name=home-basic rate-limit=5M/10M
/ppp profile add name=home-plus rate-limit=10M/20M
/ppp profile add name=home-premium rate-limit=15M/30M
/ppp profile add name=business-50m rate-limit=25M/50M
/ppp profile add name=trial rate-limit=5M/5M
