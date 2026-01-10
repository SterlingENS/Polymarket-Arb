#!/bin/bash

# Solana Trading Fund Deployment Script
# This script will deploy the entire trading fund system

set -e

echo "🚀 Solana Trading Fund Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${NETWORK:-"devnet"}
KEYPAIR_PATH=${KEYPAIR_PATH:-"$HOME/.config/solana/id.json"}

echo "Configuration:"
echo "  Network: $NETWORK"
echo "  Keypair: $KEYPAIR_PATH"
echo ""

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found${NC}"
    echo "Install with: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor not found${NC}"
    echo "Install with: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "Then: avm install latest && avm use latest"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Step 2: Set Solana configuration
echo "⚙️  Step 2: Configuring Solana..."
solana config set --url $NETWORK
solana config set --keypair $KEYPAIR_PATH

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Low balance. You may need more SOL for deployment${NC}"
    if [ "$NETWORK" == "devnet" ]; then
        echo "Getting airdrop..."
        solana airdrop 2 || echo -e "${YELLOW}Airdrop failed, continuing anyway...${NC}"
    fi
fi
echo ""

# Step 3: Build the program
echo "🔨 Step 3: Building Solana program..."
anchor build
echo -e "${GREEN}✅ Program built successfully${NC}"
echo ""

# Step 4: Deploy the program
echo "🚀 Step 4: Deploying program to $NETWORK..."
DEPLOY_OUTPUT=$(anchor deploy --provider.cluster $NETWORK 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract program ID
PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep "Program Id:" | awk '{print $3}')

if [ -z "$PROGRAM_ID" ]; then
    echo -e "${RED}❌ Failed to extract program ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Program deployed${NC}"
echo "Program ID: $PROGRAM_ID"
echo ""

# Step 5: Update Anchor.toml with program ID
echo "📝 Step 5: Updating Anchor.toml..."
sed -i.bak "s/trading_fund = \".*\"/trading_fund = \"$PROGRAM_ID\"/" Anchor.toml
echo -e "${GREEN}✅ Anchor.toml updated${NC}"
echo ""

# Step 6: Initialize the fund
echo "🏗️  Step 6: Initializing trading fund..."

# Build TypeScript client
cd app
npm install || echo -e "${YELLOW}Dependencies might already be installed${NC}"
cd ..

# Run initialization
echo "Running fund initialization..."
npx ts-node app/client.ts init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Fund initialized successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Fund might already be initialized${NC}"
fi
echo ""

# Step 7: Configure UI
echo "🎨 Step 7: Configuring UI..."
cd ui

# Install UI dependencies
echo "Installing UI dependencies..."
npm install

# Create .env.local
cat > .env.local << EOF
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=$NETWORK

# Custom RPC URL
NEXT_PUBLIC_RPC_URL=$(solana config get | grep "RPC URL" | awk '{print $3}')

# Trading Fund Program ID
NEXT_PUBLIC_PROGRAM_ID=$PROGRAM_ID
EOF

echo -e "${GREEN}✅ UI configured${NC}"
echo ""

# Step 8: Summary
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Deployment Summary:"
echo "  Network: $NETWORK"
echo "  Program ID: $PROGRAM_ID"
echo "  Fund Status: Initialized"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start the trading bot:"
echo "   npm run start-bot"
echo ""
echo "2. Start the UI:"
echo "   cd ui && npm run dev"
echo "   Then open http://localhost:3000"
echo ""
echo "3. Interact with the fund:"
echo "   npm run client deposit 1"
echo "   npm run client balance"
echo "   npm run client stats"
echo ""
echo "📝 Important files updated:"
echo "  - Anchor.toml (program ID)"
echo "  - ui/.env.local (configuration)"
echo ""
echo "💡 Tip: Save your program ID: $PROGRAM_ID"
echo ""
