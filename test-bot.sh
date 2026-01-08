#!/bin/bash
# Test script for Polymarket Arbitrage Bot

BASE_URL="http://localhost:3001/api"

echo "========================================="
echo "Polymarket Arbitrage Bot Test Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "${BLUE}[1/5] Checking server health...${NC}"
HEALTH=$(curl -s $BASE_URL/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✓ Server is healthy${NC}"
else
    echo -e "${YELLOW}✗ Server is not responding${NC}"
    exit 1
fi
echo ""

# Get current status
echo -e "${BLUE}[2/5] Getting bot status...${NC}"
STATUS=$(curl -s $BASE_URL/status | jq '.')
echo "$STATUS"
echo ""

# Start the bot
echo -e "${BLUE}[3/5] Starting the bot...${NC}"
START_RESULT=$(curl -s -X POST $BASE_URL/start)
echo "$START_RESULT" | jq '.'
sleep 2
echo ""

# Check status after starting
echo -e "${BLUE}[4/5] Checking if bot is running...${NC}"
STATUS=$(curl -s $BASE_URL/status | jq '.isRunning')
if [[ $STATUS == "true" ]]; then
    echo -e "${GREEN}✓ Bot is now running!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Success! Your bot is scanning for arbitrage opportunities!${NC}"
    echo ""
    echo "Open your browser to: ${GREEN}http://localhost:3001${NC}"
    echo ""
    echo "The bot will scan markets every 5 seconds and display opportunities in real-time."
    echo ""
    echo "To stop the bot, run:"
    echo "  curl -X POST $BASE_URL/stop"
else
    echo -e "${YELLOW}✗ Bot failed to start${NC}"
fi
echo ""

# Show opportunities (if any)
echo -e "${BLUE}[5/5] Checking for opportunities...${NC}"
OPPS=$(curl -s $BASE_URL/opportunities)
OPP_COUNT=$(echo "$OPPS" | jq 'length')
echo "Found $OPP_COUNT opportunities"
echo ""

echo "========================================="
echo "Test complete!"
echo "========================================="
