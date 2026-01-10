# Deployment Guide 🚀

This guide will walk you through deploying the Solana Trading Fund to any network (localhost, devnet, or mainnet).

## Prerequisites

Before deploying, ensure you have the following installed:

### 1. Solana CLI

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

### 2. Anchor Framework

```bash
# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install latest Anchor
avm install latest
avm use latest

# Verify installation
anchor --version
```

### 3. Node.js and npm

```bash
# Check if installed
node --version  # Should be v18+
npm --version

# If not installed, download from: https://nodejs.org
```

### 4. Rust

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify
cargo --version
```

## Quick Deployment (Automated)

The easiest way to deploy everything:

```bash
# Navigate to project directory
cd Polymarket-Arb

# Run the deployment script
./deploy.sh
```

This script will:
1. ✅ Check all prerequisites
2. ✅ Build the Solana program
3. ✅ Deploy to your chosen network
4. ✅ Initialize the fund
5. ✅ Configure the UI

### Deployment to Different Networks

```bash
# Deploy to devnet (default)
NETWORK=devnet ./deploy.sh

# Deploy to localhost (requires solana-test-validator running)
NETWORK=localhost ./deploy.sh

# Deploy to mainnet (⚠️ use with caution)
NETWORK=mainnet-beta ./deploy.sh
```

## Manual Deployment (Step by Step)

If you prefer to deploy manually or the script fails:

### Step 1: Generate a Keypair

```bash
# Generate a new keypair (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Or recover from seed phrase
solana-keygen recover
```

### Step 2: Set Network Configuration

```bash
# For localhost (requires test validator running)
solana config set --url localhost

# For devnet
solana config set --url devnet

# For mainnet
solana config set --url mainnet-beta
```

### Step 3: Get SOL for Deployment

```bash
# Check your balance
solana balance

# For devnet, request airdrop
solana airdrop 2

# For localhost, test validator gives you SOL automatically

# For mainnet, you need to acquire SOL from an exchange
```

### Step 4: Build the Program

```bash
# Navigate to project root
cd Polymarket-Arb

# Build the program
anchor build
```

This creates the compiled program in `target/deploy/`.

### Step 5: Deploy the Program

```bash
# Deploy to configured network
anchor deploy

# Note the Program ID from the output
# Example: Program Id: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

### Step 6: Update Configuration

Update `Anchor.toml` with your deployed program ID:

```toml
[programs.localnet]
trading_fund = "YOUR_PROGRAM_ID_HERE"

[programs.devnet]
trading_fund = "YOUR_PROGRAM_ID_HERE"
```

### Step 7: Install Dependencies

```bash
# Install CLI client dependencies
npm install

# Install UI dependencies
cd ui
npm install
cd ..
```

### Step 8: Initialize the Fund

```bash
# Run the initialization
npm run client init

# Or use npx
npx ts-node app/client.ts init
```

You should see:
```
✅ Fund initialized!
📝 Transaction: [signature]
💎 Fund Token Mint: [address]
```

### Step 9: Configure the UI

Create `ui/.env.local`:

```bash
cd ui
cp .env.example .env.local
```

Edit `ui/.env.local`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
```

### Step 10: Start Everything

```bash
# Terminal 1: Start the trading bot
npm run start-bot

# Terminal 2: Start the UI
cd ui
npm run dev
```

Open http://localhost:3000 in your browser!

## Local Development Setup

For local development with a test validator:

### 1. Start Test Validator

```bash
# Terminal 1: Start validator
solana-test-validator

# Keep this running
```

### 2. Configure Solana CLI

```bash
# Terminal 2: Set to localhost
solana config set --url localhost

# Check you have SOL
solana balance
```

### 3. Deploy and Run

```bash
# Build and deploy
anchor build
anchor deploy

# Initialize fund
npm run client init

# Start bot
npm run start-bot

# In another terminal, start UI
cd ui && npm run dev
```

## Verification

After deployment, verify everything works:

### 1. Check Program Deployment

```bash
# Get program info
solana program show YOUR_PROGRAM_ID

# Should show account details
```

### 2. Test CLI Commands

```bash
# Check fund stats
npm run client stats

# Make a deposit
npm run client deposit 0.1

# Check balance
npm run client balance
```

### 3. Test UI

1. Open http://localhost:3000
2. Connect your wallet
3. You should see fund statistics
4. Try depositing a small amount

## Troubleshooting

### "Program account does not exist"

- Make sure you deployed the program
- Check you're connected to the correct network
- Verify the PROGRAM_ID in `.env` matches deployed program

### "Transaction failed"

- Check you have enough SOL for gas fees
- Ensure you're on the correct network
- Verify the program is initialized

### "Failed to fetch fund state"

- Make sure the fund is initialized
- Check RPC_URL is accessible
- Verify network configuration matches wallet

### "Wallet connection failed"

- Install Phantom or Solflare wallet extension
- Ensure wallet is on same network as configured
- Try refreshing the page

### "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For UI
cd ui
rm -rf node_modules package-lock.json
npm install
```

## Network-Specific Notes

### Localhost
- Fastest for development
- Free SOL from test validator
- No rate limits
- Data resets when validator restarts

### Devnet
- Stable test environment
- Free SOL via airdrop
- Persistent data
- Good for demos

### Mainnet
- Production environment
- Requires real SOL
- Use caution with real funds
- Get professional audit first

## Security Checklist

Before deploying to mainnet:

- [ ] Smart contract audited by professionals
- [ ] All tests passing
- [ ] Multi-sig authority implemented
- [ ] Emergency pause mechanism added
- [ ] Access controls reviewed
- [ ] Integration tests on devnet
- [ ] Bug bounty program considered
- [ ] Documentation complete

## Cost Estimates

### Devnet (Free)
- Program deployment: Free (airdrop SOL)
- Transactions: Free
- Testing: Free

### Mainnet
- Program deployment: ~5-10 SOL (one-time)
- Account rent: ~0.002 SOL per account
- Transactions: ~0.000005 SOL each
- Monthly operation: Variable based on usage

## Support

If you encounter issues:

1. Check this guide thoroughly
2. Review the QUICKSTART.md
3. Check GitHub issues
4. Join Discord (if available)

## Additional Resources

- [Solana Documentation](https://docs.solana.com)
- [Anchor Book](https://book.anchor-lang.com)
- [Solana Cookbook](https://solanacookbook.com)
- [Phantom Wallet](https://phantom.app)

---

**Ready to deploy?** Run `./deploy.sh` and let the magic happen! ✨
