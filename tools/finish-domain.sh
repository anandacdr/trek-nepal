#!/usr/bin/env bash
# ============================================================
# Finish the trek.brandaid.au setup once the DNS record exists.
#
# Waits for DNS, rebuilds the site with the custom domain as the
# canonical host, deploys to production and re-points every alias.
#
#   bash tools/finish-domain.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${DOMAIN:-trek.brandaid.au}"
SCOPE="infoanandachaudhary-gmailcoms-projects"

echo "→ waiting for DNS on $DOMAIN"
n=0
until [ -n "$(dig +short "$DOMAIN" | head -1)" ] || [ $n -ge 60 ]; do
  n=$((n + 1)); sleep 10
done
resolved="$(dig +short "$DOMAIN" | head -1)"
if [ -z "$resolved" ]; then
  echo "✗ $DOMAIN still does not resolve. Add the DNS record first (see README)."
  exit 1
fi
echo "  resolves to $resolved"

echo "→ verifying with Vercel"
vercel domains inspect "$DOMAIN" --scope "$SCOPE" >/dev/null 2>&1 || true

echo "→ rebuilding with $DOMAIN as canonical host"
python3 -m http.server 8777 >/dev/null 2>&1 &
SERVER=$!
sleep 2
SITE="https://$DOMAIN" node tools/prerender.mjs
kill $SERVER 2>/dev/null || true

echo "→ committing"
git add -A
git commit -q -m "Canonical host: $DOMAIN" || echo "  (nothing to commit)"
git push -q origin "$(git branch --show-current)" || true

echo "→ deploying to production"
DEP=$(vercel deploy --prod --yes --scope "$SCOPE" 2>&1 \
      | grep -oE "https://trek-nepal-[a-z0-9]+-${SCOPE}\.vercel\.app" | head -1)
echo "  $DEP"

until curl -sf -o /dev/null "$DEP"; do sleep 3; done

echo "→ pointing aliases at the new build"
for a in "$DOMAIN" walkthehimalaya.vercel.app scroll-to-climb.vercel.app \
         5364m.vercel.app trekpassport.vercel.app; do
  vercel alias set "$DEP" "$a" --scope "$SCOPE" >/dev/null 2>&1 \
    && echo "  ✓ $a" || echo "  ✗ $a"
done

echo
echo "→ verifying"
for h in "https://$DOMAIN" https://walkthehimalaya.vercel.app; do
  code=$(curl -sL -o /dev/null -w "%{http_code}" "$h/")
  echo "  $code  $h"
done
echo
echo "Done. Primary: https://$DOMAIN"
