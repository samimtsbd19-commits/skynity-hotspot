#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🛰️  SKYNITY ISP PLATFORM — VPS SETUP              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}This script must be run as root${NC}" 1>&2
   exit 1
fi

OS=$(lsb_release -si 2>/dev/null || echo "Unknown")
if [[ "$OS" != "Ubuntu" ]]; then
    echo -e "${YELLOW}Warning: This script is optimized for Ubuntu 22.04${NC}"
fi

echo -e "${CYAN}[1/9] Updating system packages...${NC}"
apt-get update -qq
apt-get install -y -qq curl wget git unzip openssl

echo -e "${CYAN}[2/9] Installing Docker & Compose...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi

echo -e "${CYAN}[3/9] Installing Node.js 22 & pnpm...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
apt-get install -y -qq nodejs
npm install -g pnpm@9 > /dev/null 2>&1

echo -e "${CYAN}[4/9] Generating WireGuard keys...${NC}"
WG_PRIVATE=$(wg genkey 2>/dev/null || openssl rand -hex 32)
WG_PUBLIC=$(echo "$WG_PRIVATE" | wg pubkey 2>/dev/null || echo "GENERATED_ON_SETUP")

echo -e "${CYAN}[5/9] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    sed -i "s/WG_SERVER_PRIVATE_KEY=.*/WG_SERVER_PRIVATE_KEY=$WG_PRIVATE/" .env
    sed -i "s/WG_SERVER_PUBLIC_KEY=.*/WG_SERVER_PUBLIC_KEY=$WG_PUBLIC/" .env
    echo -e "${YELLOW}Please edit .env with your actual values (domain, Telegram token, etc.)${NC}"
fi

echo -e "${CYAN}[6/9] Installing dependencies...${NC}"
pnpm install

echo -e "${CYAN}[7/9] Starting infrastructure...${NC}"
cd infrastructure
docker compose up -d postgres redis caddy
sleep 5

echo -e "${CYAN}[8/9] Running database migrations & seed...${NC}"
cd ..
export DATABASE_URL="postgres://${POSTGRES_USER:-skynity_user}:${POSTGRES_PASSWORD:-skynity_pass}@localhost:5432/${POSTGRES_DB:-skynity}"
pnpm db:migrate
pnpm db:seed

echo -e "${CYAN}[9/9] Building & starting services...${NC}"
cd infrastructure
docker compose up -d --build

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🛰️  SKYNITY ISP — ONLINE!                         ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Dashboard: https://dashboard.YOUR_DOMAIN                  ║"
echo "║  API:       https://api.YOUR_DOMAIN                        ║"
echo "║  WireGuard Public Key: $WG_PUBLIC                          ║"
echo "║                                                            ║"
echo "║  Next Steps:                                               ║"
echo "║  1. Edit .env with your domain & tokens                    ║"
echo "║  2. Restart: docker compose up -d                          ║"
echo "║  3. Configure MikroTik with generated .rsc                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
