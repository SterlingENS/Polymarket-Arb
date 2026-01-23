# Deploying Privacy x402 Protocol to Solana

Complete guide for deploying and using the Privacy x402 Protocol on Solana network.

## Overview

The Privacy x402 Protocol is now multi-chain compatible with full Solana support. This guide covers deployment, configuration, and usage on Solana's high-performance blockchain.

## Why Solana?

- **Fast Confirmation**: ~400ms block times vs. Ethereum's ~12 seconds
- **Low Fees**: Transactions cost $0.00025 vs. Ethereum's variable gas fees
- **High Throughput**: 65,000+ TPS capability
- **Privacy-Friendly**: Ed25519 cryptography and account model support advanced privacy features

## Prerequisites

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

Verify installation:
```bash
solana --version
```

### 2. Install Node.js Dependencies

```bash
npm install
```

This installs all required packages including:
- `@solana/web3.js` - Solana JavaScript SDK
- `@solana/spl-token` - SPL Token support
- `@coral-xyz/anchor` - Anchor framework
- `bs58` - Base58 encoding

### 3. Configure Solana CLI

Set your network (devnet for testing):
```bash
solana config set --url devnet
```

Networks:
- `devnet` - Testing (recommended for development)
- `testnet` - Pre-production testing
- `mainnet-beta` - Production

## Quick Start

### 1. Generate Keypair

Generate a new Solana keypair:
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

Or use the deployment script to generate one automatically.

### 2. Fund Your Account (Devnet/Testnet)

For devnet testing:
```bash
solana airdrop 2
```

Check balance:
```bash
solana balance
```

### 3. Deploy Protocol

```bash
npm run deploy:solana
```

This will:
- Connect to Solana network
- Initialize the Privacy x402 Protocol
- Configure privacy settings
- Save deployment info to `deployments/` directory

### 4. Run Example

```bash
npm run example:solana
```

## Network Configuration

### Environment Variables

Create a `.env` file:

```bash
# Network (devnet, testnet, mainnet-beta)
SOLANA_NETWORK=devnet

# Custom RPC URL (optional)
SOLANA_RPC_URL=https://api.devnet.solana.com

# Keypair path (optional)
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json
```

### Recommended RPC Providers

**Devnet:**
- Default: `https://api.devnet.solana.com`
- Free and suitable for testing

**Mainnet-beta:**
- QuickNode: `https://your-node.solana-mainnet.quiknode.pro/`
- Alchemy: `https://solana-mainnet.g.alchemy.com/v2/your-key`
- Helius: `https://rpc.helius.xyz/?api-key=your-key`
- Triton: `https://your-node.rpcpool.com`

## Protocol Configuration

### Basic Configuration

```typescript
import { SolanaX402ProtocolHandler } from './src/protocol/solana-x402handler';
import { PrivacyLevel } from './src/types/protocol';

const protocol = new SolanaX402ProtocolHandler(
  {
    rpcUrl: 'https://api.devnet.solana.com',
    cluster: 'devnet',
    commitment: 'confirmed',
  },
  {
    defaultPrivacyLevel: PrivacyLevel.STEALTH,
    enableStealthAddresses: true,
    enableZKProofs: true,
    enableMixing: true,
    mixingDelayMs: 5000,
    minPrivacyScore: 0.7,
  }
);
```

### Privacy Levels on Solana

| Level | Features | Cost | Speed | Use Case |
|-------|----------|------|-------|----------|
| **NONE** | No privacy | ~0.000005 SOL | <1s | Testing |
| **BASIC** | Encryption | ~0.000005 SOL | <1s | Low-value |
| **STEALTH** | + Stealth addresses | ~0.00001 SOL | ~1s | Standard privacy |
| **ZERO_KNOWLEDGE** | + ZK proofs | ~0.00001 SOL | ~2s | High privacy |
| **MAXIMUM** | + Mixing | ~0.00001 SOL | ~5s | Max privacy |

## Usage Examples

### 1. Simple Private Transfer

```typescript
import { SolanaX402ProtocolHandler } from './src/protocol/solana-x402handler';
import { PrivacyLevel } from './src/types/protocol';

const protocol = new SolanaX402ProtocolHandler({
  rpcUrl: 'https://api.devnet.solana.com',
  cluster: 'devnet',
});

// Create transaction
const tx = await protocol.createTransaction(
  '0.1', // 0.1 SOL
  'recipient_public_key',
  { orderType: 'transfer' },
  PrivacyLevel.STEALTH
);

// Process transaction
const response = await protocol.processTransaction(tx);
console.log('Transaction hash:', response.txHash);
console.log('Privacy score:', response.privacyScore);
```

### 2. Stealth Address Payment

```typescript
import {
  generateSolanaStealthAddress,
  createSolanaStealthPayment,
} from './src/crypto/solana-stealth';

// Recipient generates stealth keys
const stealth = generateSolanaStealthAddress();
console.log('Stealth address:', stealth.address);

// Sender creates payment
const payment = createSolanaStealthPayment(
  stealth.viewKey,
  stealth.spendKey
);

// Send to one-time address
const tx = await protocol.createTransaction(
  '0.5',
  payment.stealthAddress.address,
  { confidential: true },
  PrivacyLevel.STEALTH
);
```

### 3. Scan for Incoming Stealth Payments

```typescript
import { scanForStealthPayments } from './src/crypto/solana-stealth';

const signatures = await connection.getSignaturesForAddress(myAddress);

const payments = await scanForStealthPayments(
  connection,
  myViewKey,
  mySpendKey,
  signatures.map(s => s.signature)
);

for (const payment of payments) {
  console.log('Found payment:', payment.amount, 'lamports');
  console.log('To stealth address:', payment.stealthAddress);
}
```

### 4. Arbitrage with Privacy

```typescript
const arbitrageTx = await protocol.createTransaction(
  '10.0',
  arbitrageContract,
  {
    type: 'arbitrage',
    markets: ['SOL/USDC', 'SOL/USDT'],
    expectedProfit: 0.15,
    slippage: 0.5,
  },
  PrivacyLevel.MAXIMUM
);

const result = await protocol.processTransaction(arbitrageTx);
if (result.status === X402StatusCode.SUCCESS) {
  console.log('Arbitrage executed privately!');
  console.log('Privacy score:', result.privacyScore);
}
```

## Architecture

### Solana-Specific Components

```
src/
├── crypto/
│   ├── solana-crypto.ts        # Solana cryptography utilities
│   └── solana-stealth.ts       # Solana stealth addresses
├── protocol/
│   └── solana-x402handler.ts   # Solana protocol handler
scripts/
└── deploy-solana.ts            # Deployment script
examples/
└── solana-usage.ts             # Usage examples
```

### Key Differences from Ethereum

| Feature | Ethereum | Solana |
|---------|----------|--------|
| **Key Type** | secp256k1 | Ed25519 |
| **Address Format** | 0x... (20 bytes) | Base58 (32 bytes) |
| **Account Model** | Balance-based | Account-based |
| **Transaction Fees** | Variable gas | Fixed (~0.000005 SOL) |
| **Confirmation** | ~12 seconds | ~400ms |

## Security Considerations

### Solana-Specific Security

1. **Rent Exemption**: Accounts need minimum balance (0.00089088 SOL) to be rent-exempt
2. **Transaction Size**: Max 1232 bytes per transaction
3. **Account Ownership**: Programs own accounts, not users
4. **Instruction Ordering**: Transactions are atomic but instructions execute sequentially

### Privacy Best Practices

1. **Use Stealth Addresses**: Always use PrivacyLevel.STEALTH or higher for sensitive transactions
2. **Enable Mixing**: Add temporal obfuscation with transaction mixing
3. **Rotate Keys**: Generate new stealth addresses for each transaction
4. **Monitor Privacy Scores**: Reject transactions below 0.7 privacy score
5. **Use Compression**: Solana's state compression for even lower costs

## Performance Optimization

### RPC Connection Optimization

```typescript
const protocol = new SolanaX402ProtocolHandler({
  rpcUrl: process.env.SOLANA_RPC_URL,
  commitment: 'processed', // Fastest (less secure)
  // commitment: 'confirmed', // Balanced (recommended)
  // commitment: 'finalized', // Slowest (most secure)
});
```

### Batch Transactions

```typescript
// Enable mixing for automatic batching
const protocol = new SolanaX402ProtocolHandler(
  { rpcUrl: RPC_URL },
  {
    enableMixing: true,
    mixingDelayMs: 3000, // Batch every 3 seconds
  }
);
```

### Transaction Priority Fees

```typescript
// Add priority fee for faster processing
import { ComputeBudgetProgram } from '@solana/web3.js';

transaction.add(
  ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000, // Priority fee
  })
);
```

## Cost Analysis

### Transaction Costs on Solana

| Privacy Level | Compute Units | Cost (SOL) | Cost (USD at $100/SOL) |
|--------------|---------------|------------|------------------------|
| NONE | ~1,000 | 0.000005 | $0.0005 |
| BASIC | ~2,000 | 0.000005 | $0.0005 |
| STEALTH | ~5,000 | 0.00001 | $0.001 |
| ZERO_KNOWLEDGE | ~8,000 | 0.00001 | $0.001 |
| MAXIMUM | ~10,000 | 0.00001 | $0.001 |

**Note**: Actual costs may vary based on network congestion and priority fees.

### Cost Comparison

| Network | Basic Transfer | Private Transfer | Privacy Cost Ratio |
|---------|---------------|------------------|-------------------|
| Solana | $0.0005 | $0.001 | 2x |
| Ethereum | $2-50 | $5-100 | 2-3x |
| Polygon | $0.01-0.5 | $0.02-1 | 2x |

**Solana offers 1000x-100,000x lower costs than Ethereum!**

## Monitoring and Debugging

### Check Transaction Status

```typescript
const signature = response.txHash;
const status = await connection.getSignatureStatus(signature);
console.log('Confirmation status:', status.value?.confirmationStatus);
```

### View Transaction Details

```bash
solana confirm <signature> -v
```

### Get Account Info

```bash
solana account <address>
```

### Monitor Logs

```typescript
connection.onLogs(
  protocol.getKeypair().publicKey,
  (logs) => {
    console.log('Transaction logs:', logs);
  }
);
```

## Troubleshooting

### Common Issues

**Error: "Insufficient funds"**
- Solution: Airdrop more SOL (devnet) or fund account (mainnet)
- Command: `solana airdrop 2`

**Error: "Transaction simulation failed"**
- Solution: Check account balances and rent exemption
- Check: `solana account <address>`

**Error: "Blockhash not found"**
- Solution: Recent blockhash expired, retry transaction
- The protocol handles this automatically

**Error: "Account not rent exempt"**
- Solution: Add more SOL to account (minimum ~0.00089088 SOL)

### Debug Mode

Enable verbose logging:

```typescript
const protocol = new SolanaX402ProtocolHandler(
  {
    rpcUrl: RPC_URL,
    commitment: 'confirmed',
  },
  {
    // ... config
  }
);

// Monitor all connection requests
connection.onAccountChange(address, (accountInfo) => {
  console.log('Account changed:', accountInfo);
});
```

## Production Deployment

### Mainnet Checklist

- [ ] Use production RPC provider (QuickNode, Alchemy, Helius)
- [ ] Fund account with sufficient SOL for transactions
- [ ] Set `commitment: 'confirmed'` or `'finalized'`
- [ ] Enable monitoring and alerting
- [ ] Implement transaction retry logic
- [ ] Use hardware wallet for key management
- [ ] Enable rate limiting
- [ ] Set appropriate privacy levels
- [ ] Test thoroughly on devnet first

### Mainnet Configuration

```typescript
const protocol = new SolanaX402ProtocolHandler(
  {
    rpcUrl: process.env.SOLANA_MAINNET_RPC,
    cluster: 'mainnet-beta',
    commitment: 'confirmed',
  },
  {
    defaultPrivacyLevel: PrivacyLevel.MAXIMUM,
    enableStealthAddresses: true,
    enableZKProofs: true,
    enableMixing: true,
    mixingDelayMs: 10000, // 10 seconds
    minPrivacyScore: 0.8, // Higher threshold for mainnet
  }
);
```

## Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Solana Web3.js Guide](https://solana-labs.github.io/solana-web3.js/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Privacy x402 Protocol Spec](PROTOCOL.md)
- [Example Code](examples/solana-usage.ts)

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [example code](examples/solana-usage.ts)
3. Open an issue on GitHub

## License

MIT - See [LICENSE](LICENSE) file
