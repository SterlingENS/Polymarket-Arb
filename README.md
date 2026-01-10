# Solana Trading Fund 🚀

A decentralized autonomous trading fund on Solana where users deposit SOL, the fund executes automated trades, and **10% of all profits are automatically minted as fund tokens** while **90% is reinvested** back into the fund.

## 🎯 Features

- **💰 SOL Deposits**: Users deposit SOL and receive proportional shares in the fund
- **🤖 Automated Trading**: Trading bot executes random trades across various tokens
- **💎 Profit Distribution**:
  - 10% of profits → Minted as Fund Tokens (distributed to shareholders)
  - 90% of profits → Reinvested into the fund
- **📊 Share-Based System**: Fair distribution based on proportional ownership
- **🔄 Withdrawals**: Users can withdraw at any time based on their shares
- **🎁 Fund Token Claims**: Users can claim fund tokens proportional to their ownership

## 🏗️ Architecture

### Smart Contract (Solana Program)

The core program (`programs/trading-fund/src/lib.rs`) handles:

1. **Fund Initialization**: Sets up fund state, vault, and fund token mint
2. **Deposits**: Accepts SOL, calculates and assigns shares
3. **Withdrawals**: Burns shares, returns proportional SOL
4. **Trade Execution**: Placeholder for DEX integration (Jupiter/Raydium)
5. **Profit Recording**: Distributes profits (10% token mint, 90% reinvest)
6. **Token Claims**: Allows users to claim earned fund tokens

### Trading Bot

Automated bot (`app/trading-bot.ts`) that:
- Selects random tokens to trade
- Executes trades at configured intervals
- Simulates P&L (in production, integrates with real DEXes)
- Records profits back to the smart contract

### Client Interface

User-friendly CLI (`app/client.ts`) for:
- Initializing the fund
- Depositing SOL
- Withdrawing funds
- Claiming fund tokens
- Viewing balances and statistics

## 📦 Installation

### Prerequisites

- **Rust** 1.70+
- **Solana CLI** 1.16+
- **Anchor** 0.29+
- **Node.js** 18+
- **Yarn** or **npm**

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/SterlingENS/Polymarket-Arb.git
cd Polymarket-Arb
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Generate a new keypair (if needed)**
```bash
solana-keygen new
```

5. **Start local validator (for testing)**
```bash
solana-test-validator
```

## 🚀 Usage

### 1. Build the Program

```bash
anchor build
```

### 2. Deploy the Program

```bash
# For local testing
anchor deploy

# For devnet
anchor deploy --provider.cluster devnet

# Update PROGRAM_ID in .env with the deployed program address
```

### 3. Initialize the Fund

```bash
npm run client init
```

This creates:
- Fund state account
- SOL vault
- Fund token mint
- Fund token vault

### 4. Deposit SOL

```bash
# Deposit 1 SOL
npm run client deposit 1

# Deposit 5.5 SOL
npm run client deposit 5.5
```

### 5. Start the Trading Bot

```bash
npm run start-bot
```

The bot will:
- Execute trades at configured intervals
- Display trade results
- Automatically record profits on-chain
- Show profit distribution (10% → tokens, 90% → reinvest)

### 6. Check Your Balance

```bash
npm run client balance
```

Output:
```
👤 Your Balance:
================================
Shares: 1000000000
Total Deposited: 1.0 SOL
Current Value: 1.15 SOL
Fund Ownership: 25.00%
Profit/Loss: 0.15 SOL (15.00%)
================================
```

### 7. View Fund Statistics

```bash
npm run client stats
```

Output:
```
📊 Fund Statistics:
================================
Fund Token Mint: ABC123...
Total Deposits: 4.0 SOL
Total Value: 5.2 SOL
Total Profit: 1.2 SOL
Total Shares: 4000000000
ROI: 30.00%
================================
```

### 8. Withdraw Funds

```bash
# Withdraw based on shares
npm run client withdraw 500000000
```

### 9. Claim Fund Tokens

```bash
# Claim earned fund tokens
npm run client claim 1000000
```

## ⚙️ Configuration

Edit `.env` to customize:

```bash
# Network
RPC_URL=http://localhost:8899
PROGRAM_ID=Your_Program_ID_Here
KEYPAIR_PATH=~/.config/solana/id.json

# Trading Bot
MIN_TRADE_AMOUNT=0.1        # Minimum SOL per trade
MAX_TRADE_AMOUNT=1.0        # Maximum SOL per trade
TRADE_INTERVAL=30000        # 30 seconds between trades
PROFIT_MARGIN=5             # Expected profit margin %
```

## 🧪 Testing

Run the test suite:

```bash
anchor test
```

This will:
1. Start a local test validator
2. Deploy the program
3. Run all tests in `tests/trading-fund.ts`

## 📊 How It Works

### Deposit Flow

```
User deposits 1 SOL
    ↓
Fund has 4 SOL total value, 4000 shares outstanding
    ↓
User receives: (1 SOL * 4000 shares) / 4 SOL = 1000 shares
    ↓
User now owns 20% of the fund (1000/5000)
```

### Trading & Profit Distribution

```
Bot executes trades
    ↓
Trade profits 0.5 SOL
    ↓
10% (0.05 SOL) → Minted as Fund Tokens → Stored in vault for claims
90% (0.45 SOL) → Added to fund total value
    ↓
All shareholders benefit from increased fund value
Fund token holders have additional governance/utility token
```

### Withdrawal Flow

```
User wants to withdraw 1000 shares
    ↓
Fund total value: 5.45 SOL
Total shares: 5000
    ↓
User receives: (1000 * 5.45) / 5000 = 1.09 SOL
    ↓
1000 shares burned, user gets 1.09 SOL back
```

## 🔐 Security Considerations

⚠️ **This is a development/educational project. For production use:**

1. **Audit the smart contract** - Have it professionally audited
2. **Implement DEX integration** - Currently uses simulated trades
3. **Add access controls** - Implement multi-sig for authority
4. **Risk management** - Add trade size limits, stop losses
5. **Oracle integration** - Use Pyth or Chainlink for price feeds
6. **Slippage protection** - Add slippage checks on trades
7. **Emergency pause** - Implement circuit breaker mechanism

## 📁 Project Structure

```
Polymarket-Arb/
├── programs/
│   └── trading-fund/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs          # Main Solana program
├── app/
│   ├── trading-bot.ts          # Automated trading bot
│   └── client.ts               # User CLI interface
├── tests/
│   └── trading-fund.ts         # Integration tests
├── Anchor.toml                 # Anchor configuration
├── Cargo.toml                  # Rust workspace
├── package.json                # Node dependencies
├── tsconfig.json               # TypeScript config
├── .env.example                # Environment template
└── README.md                   # This file
```

## 🎯 Roadmap

- [ ] Integrate with Jupiter DEX for real trading
- [ ] Add Raydium liquidity pool support
- [ ] Implement advanced trading strategies
- [ ] Add governance voting with fund tokens
- [ ] Create web UI dashboard
- [ ] Multi-token support (not just SOL)
- [ ] Implement stop-loss and take-profit
- [ ] Add price oracle integration
- [ ] Mobile app interface

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Anchor Framework](https://anchor-lang.com/)
- Inspired by DeFi protocols like Yearn Finance
- Solana blockchain for fast, low-cost transactions

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Join our Discord (coming soon)
- Follow updates on Twitter (coming soon)

---

**⚠️ Disclaimer**: This software is provided "as is" for educational purposes. Use at your own risk. Always do your own research before investing in any DeFi protocol.
