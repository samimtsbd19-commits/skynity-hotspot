# SKYNITY ISP Platform — VPS ও MikroTik সেটআপ গাইড

## সূচিপত্র

1. [VPS প্রস্তুতি](#১-vps-প্রস্তুতি)
2. [প্রজেক্ট ইনস্টল](#২-প্রজেক্ট-ইনস্টল)
3. [Environment Config](#৩-environment-config)
4. [Database মাইগ্রেশন](#৪-database-মাইগ্রেশন)
5. [সার্ভিস চালু করা](#৫-সার্ভিস-চালু-করা)
6. [MikroTik সেটআপ](#৬-mikrotik-সেটআপ)
7. [WireGuard Tunnel](#৭-wireguard-tunnel)
8. [সার্ভিস যাচাই](#৮-সার্ভিস-যাচাই)
9. [Telegram Bot](#৯-telegram-bot-optional)
10. [সমস্যা সমাধান](#১০-সমস্যা-সমাধান)

---

## ১. VPS প্রস্তুতি

### VPS Requirement
| বিষয় | Minimum | Recommended |
|------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 40 GB SSD |
| Port | 80, 443, 51820/UDP | 80, 443, 22, 51820/UDP |

### DNS রেকর্ড সেট করুন (আগে থেকেই)
আপনার domain registrar / Cloudflare-এ নিচের A রেকর্ডগুলো যোগ করুন।
VPS IP ধরে নিচ্ছি: `103.x.x.x`

```
dashboard.skynity.net   A   103.x.x.x
api.skynity.net         A   103.x.x.x
hotspot.skynity.net     A   103.x.x.x
```

> **Cloudflare ব্যবহার করলে:** Proxy (কমলা মেঘ) বন্ধ রাখুন — DNS only (ধূসর মেঘ) রাখুন। WireGuard UDP ট্র্যাফিক Cloudflare দিয়ে যায় না।

---

## ২. প্রজেক্ট ইনস্টল

VPS-এ SSH করুন এবং নিচের কমান্ড চালান:

```bash
# root হিসেবে লগইন করুন
sudo -i

# প্রজেক্ট clone করুন
git clone https://github.com/samimtsbd19-commits/skynity-hotspot.git /opt/skynity
cd /opt/skynity

# setup script চালান (Docker, Node.js, WireGuard ইনস্টল করবে)
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Setup script যা করবে:
- System packages আপডেট
- Docker ও Docker Compose ইনস্টল
- Node.js 22 ও pnpm ইনস্টল
- WireGuard tools ইনস্টল ও key generate
- UFW firewall configure (22, 80, 443, 51820 open)
- `.env` ফাইল তৈরি (`.env.example` থেকে)

---

## ৩. Environment Config

```bash
cd /opt/skynity
nano .env
```

নিচের প্রতিটি value পরিবর্তন করুন:

```env
# ──────────────────────────────────────
# App
# ──────────────────────────────────────
NODE_ENV=production
APP_URL=https://dashboard.skynity.net    # আপনার dashboard domain
MIKROTIK_MOCK=false                      # production-এ অবশ্যই false

# ──────────────────────────────────────
# Domain
# ──────────────────────────────────────
DOMAIN=skynity.net                       # আপনার মূল domain
HOTSPOT_PORTAL_URL=https://hotspot.skynity.net

# ──────────────────────────────────────
# Database — শক্তিশালী password দিন
# ──────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=skynity
POSTGRES_USER=skynity_user
POSTGRES_PASSWORD=MyStr0ng#DBPass2024!   # পরিবর্তন করুন

# ──────────────────────────────────────
# Redis — শক্তিশালী password দিন
# ──────────────────────────────────────
REDIS_URL=redis://:MyRedisPass2024!@redis:6379
REDIS_PASSWORD=MyRedisPass2024!          # পরিবর্তন করুন

# ──────────────────────────────────────
# Auth — random string generate করুন
# openssl rand -hex 32 দিয়ে তৈরি করুন
# ──────────────────────────────────────
JWT_SECRET=<openssl rand -hex 32 আউটপুট>
ENCRYPTION_KEY=<openssl rand -hex 16>    # ঠিক 32 character

# ──────────────────────────────────────
# FreeRADIUS — MikroTik-এর সাথে মিলাতে হবে
# ──────────────────────────────────────
RADIUS_HOST=freeradius
RADIUS_SECRET=MyRadiusSecret2024!        # পরিবর্তন করুন, MikroTik-এ একই দিতে হবে
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813

# ──────────────────────────────────────
# MikroTik API (WireGuard tunnel দিয়ে)
# ──────────────────────────────────────
MIKROTIK_HOST=10.100.0.2                 # WireGuard tunnel IP
MIKROTIK_USERNAME=skynity-api            # MikroTik-এ তৈরি করবেন
MIKROTIK_PASSWORD=MikroApiPass2024!      # পরিবর্তন করুন
MIKROTIK_DEFAULT_API_PORT=8729           # SSL API port
MIKROTIK_USE_SSL=true
MIKROTIK_API_TIMEOUT_MS=5000

# ──────────────────────────────────────
# WireGuard (setup.sh এটা স্বয়ংক্রিয় ভরবে)
# ──────────────────────────────────────
WG_SERVER_PRIVATE_KEY=<setup.sh generated>
WG_SERVER_PUBLIC_KEY=<setup.sh generated>
WG_SERVER_IP=10.100.0.1/24
WG_LISTEN_PORT=51820

# ──────────────────────────────────────
# Bootstrap (প্রথমবার run করার পরে password পরিবর্তন করুন)
# ──────────────────────────────────────
BOOTSTRAP_ADMIN_EMAIL=admin@skynity.net
BOOTSTRAP_ADMIN_PASSWORD=Admin@Skynity2024!  # পরিবর্তন করুন
BOOTSTRAP_ORG_NAME=SKYNITY ISP

# ──────────────────────────────────────
# Payment (আপনার নম্বর দিন)
# ──────────────────────────────────────
BKASH_NUMBER=01XXXXXXXXX
NAGAD_NUMBER=01XXXXXXXXX
ROCKET_NUMBER=01XXXXXXXXX
```

### Secret key generate করার কমান্ড:

```bash
# JWT_SECRET (64 char)
openssl rand -hex 32

# ENCRYPTION_KEY (ঠিক 32 char)
openssl rand -hex 16
```

---

## ৪. Database মাইগ্রেশন

```bash
cd /opt/skynity

# pnpm dependencies install
pnpm install

# infrastructure চালু করুন (postgres, redis)
cd infrastructure
docker compose up -d postgres redis
sleep 10

# migration চালান
cd ..
pnpm db:migrate

# seed data insert করুন (admin user, packages তৈরি হবে)
pnpm db:seed
```

Seed সফল হলে দেখাবে:
```
✅ Organization created: SKYNITY ISP
✅ Admin user created
✅ Packages seeded
✅ Payment configs seeded
✅ App settings seeded
🎉 Seed complete!
```

---

## ৫. সার্ভিস চালু করা

```bash
cd /opt/skynity/infrastructure

# সব service build ও start
docker compose up -d --build

# status check
docker compose ps
```

সব service `Up` দেখালে সফল:
```
NAME          STATUS
postgres      Up (healthy)
redis         Up
freeradius    Up
api           Up
web           Up
wireguard     Up
caddy         Up
```

### Log দেখতে:
```bash
# সব service
docker compose logs -f

# শুধু API
docker compose logs -f api

# শুধু Caddy (SSL cert issue হলে)
docker compose logs -f caddy
```

---

## ৬. MikroTik সেটআপ

### ধাপ ১ — API User তৈরি করুন

MikroTik Winbox বা Terminal-এ:

```routeros
# API-only user তৈরি করুন (admin নয়)
/user add name=skynity-api password=MikroApiPass2024! group=full
```

### ধাপ ২ — API Service চালু করুন

```routeros
# HTTP API (8728) ও SSL API (8729) চালু করুন
/ip service set api disabled=no port=8728
/ip service set api-ssl disabled=no port=8729

# অন্য অপ্রয়োজনীয় service বন্ধ করুন
/ip service set telnet disabled=yes
/ip service set ftp disabled=yes
```

### ধাপ ৩ — PPP Profile তৈরি করুন

```routeros
/ppp profile
add name=home-basic   rate-limit=10M/5M   local-address=192.168.88.1 remote-address=pppoe-pool
add name=home-plus    rate-limit=20M/10M  local-address=192.168.88.1 remote-address=pppoe-pool
add name=home-premium rate-limit=30M/15M  local-address=192.168.88.1 remote-address=pppoe-pool
add name=business-50m rate-limit=50M/25M  local-address=192.168.88.1 remote-address=pppoe-pool
add name=trial        rate-limit=5M/5M    local-address=192.168.88.1 remote-address=pppoe-pool
```

### ধাপ ৪ — IP Pool তৈরি করুন

```routeros
/ip pool add name=pppoe-pool ranges=192.168.88.10-192.168.88.254
```

### ধাপ ৫ — PPPoE Server চালু করুন

```routeros
/interface pppoe-server server
add service-name=SKYNITY-PPPoE interface=ether2 \
    default-profile=home-basic authentication=pap,chap,mschap2 \
    max-mtu=1480 max-mru=1480 keepalive-timeout=30 one-session-per-host=yes
```

### ধাপ ৬ — RADIUS Configure করুন

> **গুরুত্বপূর্ণ:** `.env`-এর `RADIUS_SECRET` এখানে হুবহু মিলাতে হবে।

```routeros
# RADIUS server যোগ করুন (WireGuard tunnel IP ব্যবহার করুন)
/radius
add service=ppp,hotspot address=10.100.0.1 secret=MyRadiusSecret2024! \
    timeout=3000 retransmit=3

# PPP AAA RADIUS চালু করুন
/ppp aaa set use-radius=yes accounting=yes interim-update=5m
```

### ধাপ ৭ — Hotspot Setup (ঐচ্ছিক)

```routeros
# Hotspot IP Pool
/ip pool add name=hotspot-pool ranges=192.168.89.10-192.168.89.254

# Hotspot Profile
/ip hotspot profile
add name=skynity-hotspot hotspot-address=192.168.89.1 \
    dns-name=hotspot.skynity.net login-by=http-chap \
    use-radius=yes radius-accounting=yes nas-port-type=wireless-802.11

# Hotspot Server (ether3 = hotspot interface)
/ip hotspot
add name=hotspot1 interface=ether3 address-pool=hotspot-pool \
    profile=skynity-hotspot addresses-per-mac=2

# Walled Garden — portal access allow করুন
/ip hotspot walled-garden
add dst-host=hotspot.skynity.net action=allow
add dst-host=*.bkash.com action=allow
add dst-host=*.nagad.com.bd action=allow
```

---

## ৭. WireGuard Tunnel

VPS এবং MikroTik-এর মধ্যে WireGuard tunnel দরকার কারণ MikroTik সাধারণত CGNAT-এ থাকে।

### VPS-এ Public Key দেখুন:

```bash
cat /opt/skynity/.env | grep WG_SERVER_PUBLIC_KEY
```

আউটপুট থেকে public key কপি করুন।

### MikroTik-এ WireGuard Configure করুন:

```routeros
# WireGuard interface তৈরি করুন
/interface wireguard
add name=wg-skynity listen-port=51820 mtu=1420

# WireGuard interface-এর private key দেখুন (copy করে রাখুন)
/interface wireguard print

# VPS-কে peer হিসেবে যোগ করুন
# [VPS_PUBLIC_KEY] = VPS-এর .env থেকে WG_SERVER_PUBLIC_KEY
# [VPS_IP] = VPS-এর public IP
/interface wireguard peers
add interface=wg-skynity \
    public-key="[VPS_PUBLIC_KEY]" \
    endpoint-address="[VPS_IP]" \
    endpoint-port=51820 \
    allowed-address=10.100.0.1/32 \
    persistent-keepalive=25

# WireGuard IP assign করুন
/ip address add address=10.100.0.2/24 interface=wg-skynity

# Route যোগ করুন
/ip route add dst-address=10.100.0.0/24 gateway=wg-skynity
```

### VPS-এ MikroTik Peer যোগ করুন:

MikroTik-এর WireGuard public key দিয়ে VPS-এর WireGuard config আপডেট করুন:

```bash
# MikroTik-এর public key দিয়ে peer যোগ করুন
docker exec -it $(docker ps -qf name=wireguard) \
  wg set wg0 peer "[MIKROTIK_PUBLIC_KEY]" \
  allowed-ips=10.100.0.2/32

# Tunnel test করুন
ping 10.100.0.2
```

### Tunnel যাচাই:

```bash
# VPS থেকে MikroTik ping
ping 10.100.0.2

# MikroTik থেকে VPS ping
# (MikroTik terminal-এ)
/ping 10.100.0.1
```

---

## ৮. সার্ভিস যাচাই

### API Health Check:
```bash
curl https://api.skynity.net/health
# {"status":"ok","timestamp":"..."}
```

### Dashboard:
Browser-এ যান: `https://dashboard.skynity.net`

Login করুন:
- Email: `.env`-এর `BOOTSTRAP_ADMIN_EMAIL`
- Password: `.env`-এর `BOOTSTRAP_ADMIN_PASSWORD`

### RADIUS Test:
```bash
# VPS থেকে RADIUS query করুন
docker exec -it $(docker ps -qf name=freeradius) \
  radtest testuser testpass 127.0.0.1 0 MyRadiusSecret2024!
```

### MikroTik API Test:
Dashboard-এ লগইনের পর:
1. **Settings > Routers** → New Router যোগ করুন
2. Host: `10.100.0.2`, User: `skynity-api`, Password: `MikroApiPass2024!`
3. "Test Connection" বাটন চাপুন

---

## ৯. Telegram Bot (ঐচ্ছিক)

### Bot তৈরি:
1. Telegram-এ `@BotFather`-এ যান
2. `/newbot` কমান্ড দিন
3. Bot token কপি করুন

### Admin ID বের করুন:
`@userinfobot`-এ `/start` পাঠান, আপনার ID দেখাবে।

### .env-এ যোগ করুন:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_ADMIN_IDS=123456789
```

### Service restart করুন:
```bash
cd /opt/skynity/infrastructure
docker compose restart api
```

---

## ১০. সমস্যা সমাধান

### SSL Certificate হচ্ছে না

```bash
# Caddy log দেখুন
docker compose logs caddy | grep -i error

# DNS propagation check করুন
nslookup dashboard.skynity.net

# Caddy certificate status
docker exec -it $(docker ps -qf name=caddy) caddy environ
```

**সমাধান:** DNS রেকর্ড propagate হতে 5-30 মিনিট লাগে। Cloudflare proxy বন্ধ রাখুন।

---

### API চালু হচ্ছে না

```bash
docker compose logs api | tail -50
```

সাধারণ কারণ:
- `.env`-এ `NODE_ENV=production` কিন্তু default password এখনো আছে → password পরিবর্তন করুন
- Database connection fail → `docker compose ps postgres` চেক করুন

---

### MikroTik Connection Fail

```bash
# WireGuard tunnel চেক
ping 10.100.0.2

# API port চেক (MikroTik terminal-এ)
# /ip service print
```

**সমাধান checklist:**
- [ ] MikroTik-এ WireGuard public key সঠিক কি?
- [ ] VPS IP ও port সঠিক কি?
- [ ] `MIKROTIK_USE_SSL=true` হলে MikroTik-এ `api-ssl` enable আছে কি?
- [ ] `MIKROTIK_HOST=10.100.0.2` (WireGuard IP) ব্যবহার করছেন কি?

---

### RADIUS Authentication Fail

```bash
# FreeRADIUS log
docker compose logs freeradius | tail -30
```

**চেক করুন:**
- `.env`-এর `RADIUS_SECRET` ও MikroTik RADIUS config-এর `secret` হুবহু একই কি?
- FreeRADIUS database connection ঠিক আছে কি?

---

### Database Migration Error

```bash
# Database সরাসরি চেক
docker exec -it $(docker ps -qf name=postgres) \
  psql -U skynity_user -d skynity -c "\dt"
```

---

## পরিচালনা কমান্ড

```bash
# সব service restart
cd /opt/skynity/infrastructure && docker compose restart

# শুধু API restart (code পরিবর্তনের পর)
docker compose restart api

# নতুন code deploy
cd /opt/skynity
git pull
cd infrastructure
docker compose up -d --build api web

# Backup নিন
docker exec $(docker ps -qf name=postgres) \
  pg_dump -U skynity_user skynity > backup_$(date +%Y%m%d).sql

# Service বন্ধ করুন
docker compose down

# সব data সহ সম্পূর্ণ মুছুন (সাবধান!)
docker compose down -v
```

---

## নিরাপত্তা চেকলিস্ট (Deploy-এর আগে)

- [ ] `.env`-এর সব `CHANGE_ME` value পরিবর্তন করা হয়েছে
- [ ] `MIKROTIK_MOCK=false` সেট করা হয়েছে
- [ ] `NODE_ENV=production` সেট করা হয়েছে
- [ ] UFW firewall চালু আছে (`ufw status` চেক করুন)
- [ ] SSH key-based login চালু করা হয়েছে (password login বন্ধ)
- [ ] MikroTik API user তৈরি করা হয়েছে (default `admin` ব্যবহার নয়)
- [ ] Dashboard-এ login করে admin password পরিবর্তন করা হয়েছে
- [ ] WireGuard tunnel কাজ করছে (`ping 10.100.0.2`)
- [ ] RADIUS test সফল হয়েছে
