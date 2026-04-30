# 🛰️ SKYNITY ISP Platform

```
╔════════════════════════════════════════════════════════════╗
║  ███████╗██╗  ██╗██╗   ██╗███╗   ██╗██╗████████╗██╗   ██╗  ║
║  ██╔════╝██║ ██╔╝██║   ██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝  ║
║  ███████╗█████╔╝ ██║   ██║██╔██╗ ██║██║   ██║    ╚████╔╝   ║
║  ╚════██║██╔═██╗ ██║   ██║██║╚██╗██║██║   ██║     ╚██╔╝    ║
║  ███████║██║  ██╗╚██████╔╝██║ ╚████║██║   ██║      ██║     ║
║  ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝     ║
╠════════════════════════════════════════════════════════════╣
║         Connecting the Future · ISP Management              ║
╚════════════════════════════════════════════════════════════╝
```

**SKYNITY** is a production-grade ISP Management & Monitoring Platform built for Bangladeshi ISPs running **Starlink + MikroTik** infrastructure. It features a real-time dark-themed dashboard, PPPoE/Hotspot customer management, full billing with bKash/Nagad, Telegram bot admin control, and breathtaking cyber-network UI design.

---

## ✅ Features

- [x] **Real-time Monitoring** — CPU, RAM, Temperature, Bandwidth, SFP, Queues, Ping
- [x] **MikroTik Integration** — RouterOS REST API with mock mode for development
- [x] **PPPoE & Hotspot Management** — User CRUD, active sessions, profiles
- [x] **Customer Management** — Full CRM with subscriptions
- [x] **Package & Billing** — Internet plans, orders, invoice generation
- [x] **Voucher System** — Hotspot voucher generation & printing
- [x] **Telegram Bot** — Admin commands & order approval flow
- [x] **FreeRADIUS Integration** — AAA with PostgreSQL backend
- [x] **WireGuard VPN** — Starlink CGNAT fix
- [x] **Dark Cyber UI** — Glassmorphism, neon glows, animated starfield
- [x] **Docker Deployment** — One-command VPS setup

---

## 🏗️ Architecture

```
                         ┌─────────────────┐
                         │    STARLINK      │
                         │  (Upstream ISP)  │
                         └────────┬────────┘
                                  │ WAN
                         ┌────────▼────────┐
                         │   MikroTik      │
                         │  Router / RB    │
                         └───┬────────┬───┘
               WireGuard VPN │        │ RouterOS REST API
                  (CGNAT fix)│        │ (port 8728/8729)
                    ┌────────▼───┐   │
                    │ VPS/Server │◄──┘
                    │            │
              ┌─────┤  Services  ├──────┐
              │     │            │      │
         ┌────▼───┐ │ FreeRADIUS │ ┌───▼────┐
         │Postgres│ │  (RADIUS)  │ │ Redis  │
         └────────┘ └─────┬──────┘ └────────┘
                          │
                    ┌─────▼──────┐
                    │  Fastify   │  ← REST API + Socket.IO
                    │   API      │
                    └─────┬──────┘
               ┌──────────┼──────────┐
         ┌─────▼────┐ ┌───▼───┐ ┌───▼──────┐
         │ Next.js  │ │Telegram│ │ BullMQ   │
         │Dashboard │ │  Bot  │ │  Jobs    │
         └──────────┘ └───────┘ └──────────┘
```

---

## 📋 Prerequisites

- VPS with **2GB+ RAM**, **Ubuntu 22.04**
- Domain name (pointed to VPS)
- MikroTik router with RouterOS v7+
- Starlink dish (or any upstream ISP)

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/YOUR/skynity /var/www/skynity
cd /var/www/skynity

# 2. Run setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Edit environment
nano .env

# 4. Deploy
cd infrastructure
docker compose up -d --build
```

**Dashboard:** `https://dashboard.your-domain.com`  
**Default Login:** `admin@skynity.net` / (set in `BOOTSTRAP_ADMIN_PASSWORD`)

---

## 🔧 Manual Setup

```bash
# Install dependencies
pnpm install

# Start database only
cd infrastructure
docker compose up -d postgres redis

# Migrate & seed
pnpm db:migrate
pnpm db:seed

# Run dev servers
pnpm dev
```

---

## 🌐 Starlink + MikroTik CGNAT Solution

Since Starlink uses CGNAT (no public IP), SKYNITY uses **WireGuard VPN**:

1. **VPS** runs WireGuard server (`10.100.0.1`)
2. **MikroTik** connects as peer (`10.100.0.2`)
3. **API calls** go through tunnel: `VPS → 10.100.0.2:8729`
4. **RADIUS auth** goes through tunnel: `MikroTik → 10.100.0.1:1812`

### MikroTik WireGuard Config

Import `scripts/mikrotik-setup.rsc` or run:

```rsc
/interface wireguard add name=wg-skynity private-key="..."
/interface wireguard peers add interface=wg-skynity public-key="..." endpoint-address="VPS_IP" endpoint-port=51820 allowed-address=10.100.0.1/32 persistent-keepalive=25
/ip address add address=10.100.0.2/24 interface=wg-skynity
```

---

## 🤖 Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create new bot → copy token
3. Paste token in `.env` as `TELEGRAM_BOT_TOKEN`
4. Set admin chat IDs in `TELEGRAM_ADMIN_IDS`
5. Restart API container

**Admin Commands:**
- `/stats` — Quick overview
- `/online` — Live users
- `/bandwidth` — WAN traffic
- `/pending` — Order approvals
- `/ping [host]` — Latency check
- `/tunnel` — WireGuard status

---

## 🌐 Hotspot Portal

The hotspot portal is served at `https://hotspot.your-domain.com` via Caddy.

To deploy on MikroTik:
1. Edit `hotspot-portal/login.html` with your branding
2. Upload to MikroTik WebFig or FTP
3. Set hotspot HTML directory: `/ip hotspot profile set hsprof1 html-directory=skynity`

---

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | 64+ char secret for tokens |
| `ENCRYPTION_KEY` | 32-byte hex for AES-256 |
| `MIKROTIK_MOCK` | `true` for dev without router |
| `TELEGRAM_BOT_TOKEN` | BotFather token |
| `RADIUS_SECRET` | FreeRADIUS shared secret |
| `DOMAIN` | Base domain |

See `.env.example` for full list.

---

## 🛡️ Security

- JWT access tokens (15 min expiry)
- Refresh token rotation with httpOnly cookies
- AES-256-GCM encrypted router passwords
- Zod validation on all inputs
- Rate limiting (10 req/min auth, 60 req/min API)
- RBAC middleware (superadmin, admin, reseller, viewer)
- Helmet headers + strict CSP

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Backend | Fastify 5 + TypeScript |
| Frontend | Next.js 15 + Tailwind CSS |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache | Redis 7 |
| Queue | BullMQ |
| Auth | JWT (jose) + bcrypt |
| Real-time | Socket.IO v4 |
| Charts | Recharts |
| Bot | grammY |
| Proxy | Caddy 2 |

---

## 📝 License

MIT License — Built for Bangladeshi ISPs.

---

*SKYNITY ISP Platform — Prompt Version: 3.0 Final*  
*Brand: SKYNITY · Tagline: "Connecting the Future"*
