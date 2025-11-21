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
# Sett working directory eksplisitt
cd "$(dirname "$0")" || exit 1
# Push og fang både stdout og stderr, men ignorer dev-cursor feil
PUSH_OUTPUT=$(git push origin main 2>&1)
PUSH_EXIT=$?
# Sjekk om push faktisk var vellykket ved å se etter "main -> main" i outputen
if echo "$PUSH_OUTPUT" | grep -q "main -> main"; then
    echo -e "${GREEN}✅ Pushet til GitHub${NC}"
    echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
elif [ $PUSH_EXIT -eq 0 ]; then
    # Exit code 0 betyr suksess, selv om vi ikke ser "main -> main"
    echo -e "${GREEN}✅ Pushet til GitHub${NC}"
    echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
elif echo "$PUSH_OUTPUT" | grep -q "dev-cursor"; then
    # Hvis det bare er dev-cursor feil, sjekk om vi faktisk er ahead
    if git status | grep -q "ahead"; then
        # Prøv en gang til - noen ganger fungerer det på andre forsøk
        if git push origin main 2>&1 | grep -q "main -> main"; then
            echo -e "${GREEN}✅ Pushet til GitHub${NC}"
            echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
        else
            echo -e "${YELLOW}⚠️  Dev-cursor feil, men sjekker status...${NC}"
            # Sjekk om vi fortsatt er ahead - hvis ikke, ble det pushet
            if ! git status | grep -q "ahead"; then
                echo -e "${GREEN}✅ Pushet til GitHub (dev-cursor feil ignorert)${NC}"
                echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
            else
                echo -e "${YELLOW}⚠️  Push feilet${NC}"
                exit 1
            fi
        fi
    else
        echo -e "${GREEN}✅ Allerede oppdatert${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Git push feilet: $PUSH_OUTPUT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ gpdev fullført!${NC}"


