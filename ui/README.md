# Solana Trading Fund UI 💎

Modern web interface for the Solana Trading Fund with wallet integration and real-time updates.

## Features

- **🔌 Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **📊 Real-time Stats**: Live fund statistics and performance metrics
- **💰 Easy Deposits**: Simple interface to deposit SOL into the fund
- **📤 Quick Withdrawals**: Withdraw your position anytime
- **📈 Portfolio Tracking**: Track your shares, profit/loss, and ownership percentage
- **🤖 Trading Activity**: See live trading activity from the bot
- **📱 Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Solana Wallet Adapter** - Wallet integration
- **@coral-xyz/anchor** - Solana program interaction
- **@solana/web3.js** - Solana blockchain interaction

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Solana wallet (Phantom recommended)
- The trading fund program deployed on Solana

### Installation

1. **Navigate to the UI directory**
```bash
cd ui
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=http://localhost:8899
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Network Selection

Update `NEXT_PUBLIC_SOLANA_NETWORK` in `.env.local`:

- `localhost` - Local test validator
- `devnet` - Solana devnet
- `testnet` - Solana testnet
- `mainnet-beta` - Solana mainnet (production)

### Custom RPC

For better performance, use a custom RPC endpoint:

```bash
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
# Or use services like QuickNode, Helius, etc.
```

## Usage Guide

### 1. Connect Wallet

Click the "Select Wallet" button in the top right corner and connect your Solana wallet.

### 2. View Fund Stats

The dashboard shows:
- Total fund value
- Total deposits
- Total profit
- ROI percentage
- Your position details

### 3. Deposit SOL

1. Enter the amount of SOL to deposit
2. Or use quick buttons (1, 5, 10 SOL)
3. Click "Deposit"
4. Approve the transaction in your wallet

### 4. Track Your Position

After depositing, you'll see:
- Current value of your position
- Total deposited amount
- Profit/loss
- Your share count
- Fund ownership percentage

### 5. Withdraw Funds

1. Choose percentage to withdraw (25%, 50%, 75%, 100%)
2. Preview the withdrawal amount
3. Click "Withdraw"
4. Approve the transaction

### 6. Monitor Trading

The "Trading Activity" panel shows:
- Recent trades executed by the bot
- Trade type (buy/sell)
- Token traded
- Profit/loss per trade
- Bot status

## Building for Production

```bash
npm run build
npm run start
```

Or deploy to Vercel:

```bash
npm install -g vercel
vercel
```

## Project Structure

```
ui/
├── src/
│   ├── app/
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── Header.tsx        # Navigation header
│   │   ├── FundStats.tsx     # Fund statistics
│   │   ├── UserBalance.tsx   # User portfolio
│   │   ├── DepositForm.tsx   # Deposit interface
│   │   ├── WithdrawForm.tsx  # Withdrawal interface
│   │   └── TradingActivity.tsx # Trading feed
│   ├── contexts/
│   │   └── WalletContextProvider.tsx # Wallet provider
│   └── hooks/
│       └── useTradingFund.ts # Fund interaction hook
├── public/                    # Static assets
├── .env.example              # Environment template
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Tailwind config
└── package.json              # Dependencies
```

## Customization

### Theme Colors

Edit `tailwind.config.ts` to customize colors:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

### Wallet Options

Add or remove wallet adapters in `WalletContextProvider.tsx`:

```typescript
const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    // Add more wallets here
  ],
  []
);
```

## Troubleshooting

### "Failed to fetch fund state"

- Ensure the program is deployed
- Check `NEXT_PUBLIC_PROGRAM_ID` is correct
- Verify RPC endpoint is accessible

### "Wallet connection failed"

- Make sure wallet extension is installed
- Try refreshing the page
- Check wallet is on the correct network

### "Transaction failed"

- Ensure you have enough SOL for gas fees
- Check the fund has been initialized
- Verify wallet is connected to correct network

### Build errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Development Tips

### Hot Reload

The dev server supports hot reload. Changes to components will reflect immediately.

### Testing Locally

1. Start local Solana validator
2. Deploy the program
3. Set `NEXT_PUBLIC_RPC_URL=http://localhost:8899`
4. Initialize the fund with CLI
5. Open the UI and connect wallet

### Debugging

Enable verbose logging:

```typescript
// In useTradingFund.ts
console.log('Fund State:', fundState);
console.log('User Account:', userAccount);
```

## Performance Optimization

### RPC Caching

The hook auto-refreshes data every 10 seconds. Adjust in `useTradingFund.ts`:

```typescript
const interval = setInterval(() => {
  fetchFundState();
  fetchUserAccount();
}, 5000); // 5 seconds instead of 10
```

### Image Optimization

Use Next.js Image component for optimized images:

```typescript
import Image from 'next/image';
```

## Security Considerations

- Never commit `.env.local` with real keys
- Use environment variables for sensitive data
- Validate all user inputs
- Test on devnet before mainnet
- Keep dependencies updated

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Check the main README.md
- Join our Discord (coming soon)

---

**Built with 💜 on Solana**
