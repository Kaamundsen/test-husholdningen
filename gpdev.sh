#!/bin/bash

# gpdev - Git Push to GitHub
# Dette scriptet pusher endringer til GitHub
# Du kan deploye til Shopify manuelt fra GitHub eller via Shopify CLI

echo "🚀 Starter gpdev - Git Push to GitHub..."

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
if git push origin main 2>&1; then
    echo -e "${GREEN}✅ Pushet til GitHub${NC}"
    echo -e "${BLUE}💡 For å deploye til Shopify, kjør: shopify theme push --live${NC}"
else
    echo -e "${YELLOW}⚠️  Git push feilet${NC}"
    exit 1
fi

echo -e "${GREEN}✅ gpdev fullført!${NC}"

