#!/usr/bin/env bash
# Creates .env for docker compose (testing over http://<server-ip>) and starts the site.
# Usage on the server:  bash setup-env.sh
set -e
cd "$(dirname "$0")"

IP=$(curl -s https://checkip.amazonaws.com || curl -s ifconfig.me)
IP=$(echo "$IP" | tr -d '[:space:]')

read -rp "Admin email: " ADMIN_EMAIL
read -rp "Admin name: " ADMIN_NAME
while true; do
  read -rsp "Admin password (10+ chars, letters and numbers): " ADMIN_PASS; echo
  if [ ${#ADMIN_PASS} -ge 10 ] && [[ "$ADMIN_PASS" =~ [A-Za-z] ]] && [[ "$ADMIN_PASS" =~ [0-9] ]]; then break; fi
  echo "Too weak — try again."
done

cat > .env <<EOF
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 48)
SITE_URL=http://$IP
CLIENT_ORIGIN=http://$IP
COOKIE_SECURE=false
SEED_ADMIN_EMAIL=$ADMIN_EMAIL
SEED_ADMIN_NAME=$ADMIN_NAME
SEED_ADMIN_PASSWORD=$ADMIN_PASS
EOF

echo
echo "✓ .env created for http://$IP"
echo "Building and starting (first time takes ~10 minutes)…"
sudo docker compose up -d --build
echo
echo "✓ Done. Open http://$IP  and  http://$IP/admin"
echo "  Logs: sudo docker compose logs -f app"
