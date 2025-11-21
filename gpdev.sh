#!/bin/bash

# gpdev - Git Push to GitHub
# Dette scriptet pusher endringer til GitHub
# GitHub deployer automatisk til testshoppen

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
# Sett working directory eksplisitt og unngå problemer med refspecs
cd "$(dirname "$0")" || exit 1
# Bruk eksplisitt push og filtrer bort dev-cursor feil
PUSH_OUTPUT=$(git push origin main 2>&1)
PUSH_EXIT=$?
# Sjekk om push faktisk var vellykket (exit code 0) eller om det bare er dev-cursor feil
if [ $PUSH_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Pushet til GitHub${NC}"
    echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
elif echo "$PUSH_OUTPUT" | grep -q "dev-cursor"; then
    # Sjekk om main faktisk ble pushet til tross for dev-cursor feil
    if echo "$PUSH_OUTPUT" | grep -q "main -> main"; then
        echo -e "${GREEN}✅ Pushet til GitHub (dev-cursor feil ignorert)${NC}"
        echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
    else
        # Prøv en gang til med ren push
        if git push origin main 2>&1 | grep -q "main -> main"; then
            echo -e "${GREEN}✅ Pushet til GitHub${NC}"
            echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
        else
            echo -e "${YELLOW}⚠️  Git push feilet${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Git push feilet: $PUSH_OUTPUT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ gpdev fullført!${NC}"

