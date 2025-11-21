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
# Sjekk om vi er ahead før push
WAS_AHEAD=$(git status | grep -q "ahead" && echo "yes" || echo "no")
# Push - redirect stderr for å fange dev-cursor feil separat
git push origin main > /tmp/gpdev_push_stdout.txt 2> /tmp/gpdev_push_stderr.txt
PUSH_EXIT=$?
PUSH_STDOUT=$(cat /tmp/gpdev_push_stdout.txt)
PUSH_STDERR=$(cat /tmp/gpdev_push_stderr.txt)
# Sjekk om push faktisk fungerte
if echo "$PUSH_STDOUT" | grep -q "main -> main"; then
    echo -e "${GREEN}✅ Pushet til GitHub${NC}"
    echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
elif [ "$WAS_AHEAD" = "yes" ] && ! git status | grep -q "ahead"; then
    # Vi var ahead før, men ikke nå - push fungerte!
    echo -e "${GREEN}✅ Pushet til GitHub (dev-cursor feil ignorert)${NC}"
    echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
elif echo "$PUSH_STDERR" | grep -q "dev-cursor" && [ $PUSH_EXIT -ne 0 ]; then
    # Dev-cursor feil, men sjekk om vi fortsatt er ahead
    if git status | grep -q "ahead"; then
        echo -e "${YELLOW}⚠️  Push feilet pga dev-cursor feil${NC}"
        echo -e "${BLUE}💡 Prøver direkte push uten script...${NC}"
        # Prøv direkte push som backup
        if git push origin main 2>&1 | grep -q "main -> main"; then
            echo -e "${GREEN}✅ Pushet til GitHub${NC}"
            echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
        else
            echo -e "${YELLOW}⚠️  Push feilet. Prøv manuelt: git push origin main${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Pushet til GitHub (dev-cursor feil ignorert)${NC}"
        echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
    fi
elif [ $PUSH_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Pushet til GitHub${NC}"
    echo -e "${GREEN}✅ Endringene vil automatisk deployes til testshoppen${NC}"
else
    echo -e "${YELLOW}⚠️  Git push feilet${NC}"
    echo -e "${YELLOW}STDOUT: $PUSH_STDOUT${NC}"
    echo -e "${YELLOW}STDERR: $PUSH_STDERR${NC}"
    exit 1
fi
# Rydd opp
rm -f /tmp/gpdev_push_stdout.txt /tmp/gpdev_push_stderr.txt

echo -e "${GREEN}✅ gpdev fullført!${NC}"


