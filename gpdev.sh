#!/bin/bash

# gpdev - Git Push and Deploy
# Dette scriptet pusher endringer til GitHub og deployer til Shopify

set -e  # Stopp ved feil

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
git push origin main || git push origin master || echo "⚠️  Kunne ikke pushe til GitHub"

# 5. Deploy til Shopify
echo -e "${BLUE}🛍️  Deployer til Shopify...${NC}"
shopify theme push --live || echo "⚠️  Kunne ikke deploye til Shopify"

echo -e "${GREEN}✅ gpdev fullført!${NC}"

