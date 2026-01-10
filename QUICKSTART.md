# Quick Start Guide 🚀

Get your Solana trading fund up and running in 5 minutes!

## Prerequisites

Make sure you have these installed:
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (v18+)

## Step 1: Clone and Install

```bash
git clone https://github.com/SterlingENS/Polymarket-Arb.git
cd Polymarket-Arb
npm install
```

## Step 2: Setup Environment

```bash
cp .env.example .env
```

Your `.env` should look like:
```env
RPC_URL=http://localhost:8899
PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
KEYPAIR_PATH=~/.config/solana/id.json
MIN_TRADE_AMOUNT=0.1
MAX_TRADE_AMOUNT=1.0
TRADE_INTERVAL=30000
```

## Step 3: Start Local Validator

Open a new terminal and run:
```bash
solana-test-validator
```

Keep this running in the background.

## Step 4: Build and Deploy

In your main terminal:
```bash
# Build the program
anchor build

# Deploy to local validator
anchor deploy

# Copy the program ID from the output and update .env if different
```

## Step 5: Initialize the Fund

```bash
npm run client init
```

You should see:
```
✅ Fund initialized!
📝 Transaction: [transaction signature]
💎 Fund Token Mint: [token mint address]
```

## Step 6: Deposit SOL

```bash
# First, get some SOL (local validator gives you 500M SOL by default)
solana balance

# Deposit 10 SOL into the fund
npm run client deposit 10
```

## Step 7: Start Trading Bot

In a new terminal:
```bash
npm run start-bot
```

You'll see output like:
```
🤖 Trading Bot Starting...
Authority: [your address]
Fund State: [fund address]
Trade Interval: 30s
================================

✅ Bot is now running. Press Ctrl+C to stop.

[2026-01-10T...] Starting trading cycle...
💰 Fund Total Value: 10 SOL
🎯 Selected token: BONK
💵 Trade amount: 0.5 SOL
✅ Trade profitable! Profit: 0.05 SOL
💎 10% (0.005 SOL) → Fund Token
♻️  90% (0.045 SOL) → Reinvested
```

## Step 8: Check Your Balance

In another terminal:
```bash
npm run client balance
```

Output:
```
👤 Your Balance:
================================
Shares: 10000000000
Total Deposited: 10.0 SOL
Current Value: 10.045 SOL
Fund Ownership: 100.00%
Profit/Loss: 0.045 SOL (0.45%)
================================
```

## Step 9: View Fund Stats

```bash
npm run client stats
```

Output:
```
📊 Fund Statistics:
================================
Total Deposits: 10.0 SOL
Total Value: 10.045 SOL
Total Profit: 0.05 SOL
Total Shares: 10000000000
ROI: 0.45%
================================
```

## Step 10: Withdraw (Optional)

When you want to withdraw:
```bash
# Withdraw half your shares (5 billion shares)
npm run client withdraw 5000000000
```

---

## Testing the System

Run the automated tests:
```bash
anchor test
```

This will test all functionality: initialization, deposits, withdrawals, trading, and profit distribution.

---

## Troubleshooting

### "Error: Account not found"
- Make sure the local validator is running
- Ensure you've initialized the fund with `npm run client init`

### "Error: Insufficient funds"
- Check your balance: `solana balance`
- On local validator, you should have plenty of SOL
- Use `solana airdrop 10` to get more SOL

### "Program not found"
- Make sure you've run `anchor deploy`
- Check that PROGRAM_ID in `.env` matches the deployed program

### Trading bot not executing trades
- Verify the fund has SOL deposited
- Check the bot's authority matches the fund authority
- Look for error messages in the bot output

---

## What's Next?

1. **Watch the bot trade** - Let it run for a few minutes and watch profits accumulate
2. **Add more users** - Create more wallets and have them deposit
3. **Test withdrawals** - Try withdrawing different share amounts
4. **Claim fund tokens** - Use `npm run client claim 1000` to claim earned tokens
5. **Check the code** - Explore `programs/trading-fund/src/lib.rs` to understand the smart contract

## Production Deployment

To deploy to devnet/mainnet:

```bash
# Set cluster to devnet
solana config set --url devnet

# Get devnet SOL
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet

# Update .env with new PROGRAM_ID and RPC_URL
```

---

## Commands Cheat Sheet

```bash
# Initialize
npm run client init

# Deposit
npm run client deposit <amount>

# Withdraw
npm run client withdraw <shares>

# Check balance
npm run client balance

# View stats
npm run client stats

# Claim tokens
npm run client claim <amount>

# Start bot
npm run start-bot

# Run tests
anchor test
```

---

**Need help?** Check the full [README.md](./README.md) for detailed documentation.
