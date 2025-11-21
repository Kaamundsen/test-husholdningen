#!/bin/bash

# gpdev - Git Push and Deploy
# Dette scriptet pusher endringer til GitHub og deployer til Shopify

# Ikke stopp ved feil - fortsett med deploy selv om git push feiler

echo "🚀 Starter gpdev - Git Push and Deploy..."

# Fargekoder for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Sjekk git status
echo -e "${BLUE}📋 Sjekker git status...${NC}"
git status

# 2. Legg til alle endringer
echo -e "${BLUE}➕ Legger til endringer...${NC}"
git add .

# 3. Commit med timestamp
COMMIT_MSG="Update theme - $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BLUE}💾 Committer endringer: ${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG" || echo "⚠️  Ingen endringer å committe"

# 4. Push til GitHub
echo -e "${BLUE}📤 Pusher til GitHub...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
# Sett push.default for å unngå problemer
git config push.default simple 2>/dev/null || true
# Bruk eksplisitt push til å unngå problemer med refspecs
PUSH_OUTPUT=$(git push origin "$CURRENT_BRANCH" 2>&1)
PUSH_EXIT_CODE=$?
if [ $PUSH_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Pushet til GitHub${NC}"
elif echo "$PUSH_OUTPUT" | grep -q "dev-cursor"; then
    # Ignorer dev-cursor feil og prøv direkte push til main
    echo -e "${YELLOW}⚠️  Ignorerer dev-cursor feil, prøver direkte push...${NC}"
    git push origin main 2>&1 && echo -e "${GREEN}✅ Pushet til GitHub${NC}" || echo -e "${YELLOW}⚠️  Git push feilet, men fortsetter med Shopify deploy...${NC}"
else
    echo -e "${YELLOW}⚠️  Git push feilet: $PUSH_OUTPUT${NC}"
    echo -e "${YELLOW}⚠️  Fortsetter med Shopify deploy...${NC}"
fi

# 5. Deploy til Shopify
echo -e "${BLUE}🛍️  Deployer til Shopify...${NC}"
shopify theme push --live || echo "⚠️  Kunne ikke deploye til Shopify"

echo -e "${GREEN}✅ gpdev fullført!${NC}"

