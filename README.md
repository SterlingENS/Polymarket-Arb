# Polymarket Arbitrage Bot

An automated bot that scans Polymarket prediction markets for arbitrage opportunities and alerts you when profitable trades are detected.

## 🎯 What is Arbitrage on Polymarket?

Arbitrage on prediction markets occurs when the sum of prices for all outcomes in a market is less than 1 (100%). This creates a risk-free profit opportunity by buying all outcomes.

**Example:**
- Market: "Will it rain tomorrow?"
- YES price: 0.45 ($0.45)
- NO price: 0.50 ($0.50)
- Total cost: 0.95 ($0.95)
- Guaranteed payout: 1.00 ($1.00)
- **Risk-free profit: $0.05 (5.26% return)**

## 🚀 Features

- **Real-time Market Scanning**: Continuously monitors all active Polymarket markets
- **Automated Arbitrage Detection**: Identifies profitable arbitrage opportunities
- **Configurable Thresholds**: Set minimum profit percentages and position sizes
- **Position Size Calculator**: Automatically calculates optimal position sizes
- **Detailed Reporting**: Shows profit percentages, investment needed, and expected returns
- **TypeScript**: Fully typed for better development experience

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Basic understanding of prediction markets

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Polymarket-Arb
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your settings in `.env`:
```env
# Polymarket API Configuration
POLYMARKET_API_URL=https://clob.polymarket.com
POLYMARKET_GAMMA_API_URL=https://gamma-api.polymarket.com

# Bot Settings
MIN_PROFIT_PERCENTAGE=1.0        # Minimum profit % to alert
CHECK_INTERVAL_MS=5000           # How often to scan (5 seconds)
MAX_POSITION_SIZE_USDC=100       # Maximum investment per opportunity
```

## 🎮 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build the project
npm run build

# Run the bot
npm start
```

### Output Example
```
🤖 Polymarket Arbitrage Bot Started
================================================================================
Min Profit Threshold: 1.0%
Check Interval: 5000ms
Max Position Size: $100
================================================================================

Searching for arbitrage opportunities...

================================================================================
🎯 ARBITRAGE OPPORTUNITY DETECTED
================================================================================
Market: Will it rain in San Francisco tomorrow?
Market ID: 0x1234...

Prices:
  YES: 0.4500 (45.00%)
  NO: 0.5000 (50.00%)

Sum of prices: 0.9500
Profit percentage: 5.26%
Investment needed: $0.9500 per unit
Expected profit: $0.0500 per unit

Strategy: Buy all outcomes and guarantee profit when market resolves
================================================================================

Recommended positions:
  YES: $47.37
  NO: $52.63

✅ Found 1 arbitrage opportunities!
```

## 🔧 Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `MIN_PROFIT_PERCENTAGE` | Minimum profit % to trigger alert | `1.0` |
| `CHECK_INTERVAL_MS` | Milliseconds between market scans | `5000` |
| `MAX_POSITION_SIZE_USDC` | Maximum $ to invest per opportunity | `100` |
| `POLYMARKET_API_URL` | Polymarket CLOB API endpoint | `https://clob.polymarket.com` |
| `POLYMARKET_GAMMA_API_URL` | Polymarket Gamma API endpoint | `https://gamma-api.polymarket.com` |

## 📊 How It Works

1. **Market Scanning**: The bot fetches all active markets from Polymarket's API
2. **Price Analysis**: For each market, it calculates the sum of all outcome prices
3. **Arbitrage Detection**: If price sum < 1, an arbitrage opportunity exists
4. **Profit Calculation**: Calculates profit percentage and expected returns
5. **Alert**: Displays opportunities that meet the minimum profit threshold
6. **Position Sizing**: Recommends how much to invest in each outcome

## ⚠️ Important Notes

### This is a Detection Bot Only
This bot **DOES NOT execute trades automatically**. It only detects and alerts you to arbitrage opportunities. You must execute trades manually on Polymarket.

### Why Arbitrage Opportunities Exist
- **Market inefficiencies**: Different participants have different information
- **Liquidity constraints**: Not enough liquidity to close the gap
- **Speed**: Opportunities may disappear quickly
- **Transaction costs**: Factor in gas fees and trading fees

### Risks to Consider
1. **Price Movement**: Prices can change between detection and execution
2. **Liquidity**: May not be enough liquidity to fill your orders
3. **Gas Fees**: Polygon transaction fees reduce profits
4. **Trading Fees**: Polymarket charges fees on trades
5. **Slippage**: Large orders may move the market against you

## 🧪 Testing

The bot includes TypeScript type checking:
```bash
npm run build
```

## 📁 Project Structure

```
Polymarket-Arb/
├── src/
│   ├── index.ts              # Main entry point
│   ├── bot.ts                # Bot orchestration logic
│   ├── polymarket-client.ts  # API client for Polymarket
│   ├── arbitrage-detector.ts # Arbitrage detection logic
│   ├── config.ts             # Configuration management
│   └── types.ts              # TypeScript type definitions
├── .env.example              # Example environment variables
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🔐 Security

- Never commit your `.env` file
- Keep your private keys secure
- Use environment variables for sensitive data
- Review all transactions before executing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📝 License

MIT

## ⚖️ Disclaimer

This software is for educational purposes only. Trading prediction markets involves financial risk. The authors are not responsible for any financial losses incurred while using this bot. Always do your own research and never invest more than you can afford to lose.

## 📚 Resources

- [Polymarket](https://polymarket.com/)
- [Polymarket API Documentation](https://docs.polymarket.com/)
- [Prediction Market Arbitrage](https://en.wikipedia.org/wiki/Arbitrage)

---

**Happy Trading! 🚀**
