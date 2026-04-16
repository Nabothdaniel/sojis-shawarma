#!/bin/bash

# =====================================================
#  BamzySMS — Local Tunnel for PaymentPoint Webhooks
# =====================================================
# Exposes your local PHP backend (port 8000) to the
# internet so PaymentPoint can reach your local webhook.
#
# Usage:
#   ./tunnel.sh
#
# Then set this URL in your PaymentPoint dashboard:
#   https://<subdomain>.loca.lt/api/webhook/paymentpoint

PORT=8000
SUBDOMAIN="bamzysms-dev"   # <- change to something unique to avoid conflicts

WEBHOOK_PATH="/api/webhook/paymentpoint"

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║       BamzySMS — Webhook Tunnel              ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""
echo "  Tunnelling port $PORT  →  https://$SUBDOMAIN.loca.lt"
echo ""
echo "  ┌──────────────────────────────────────────────┐"
echo "  │  Webhook URL for PaymentPoint dashboard:     │"
echo "  │                                              │"
echo "  │  https://$SUBDOMAIN.loca.lt$WEBHOOK_PATH    │"
echo "  └──────────────────────────────────────────────┘"
echo ""
echo "  ⚡ Tip: If you see a 'visitor IP' confirmation page,"
echo "     run this to get your IP and enter it there:"
echo "     curl ifconfig.me"
echo ""

# Try to use globally installed 'lt'; fall back to npx
if command -v lt &> /dev/null; then
    lt --port "$PORT" --subdomain "$SUBDOMAIN"
elif command -v npx &> /dev/null; then
    npx localtunnel --port "$PORT" --subdomain "$SUBDOMAIN"
else
    echo "  ERROR: Neither 'lt' nor 'npx' found."
    echo "  Install localtunnel with:  npm install -g localtunnel"
    exit 1
fi
