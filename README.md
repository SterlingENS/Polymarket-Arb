# Polymarket-Arb

Privacy-preserving arbitrage trading system for Polymarket with integrated x402 protocol.

## Features

- **Privacy x402 Protocol**: Advanced privacy-preserving transaction protocol
- **Multi-Chain Support**: Full support for Ethereum and Solana blockchains
- **Multiple Privacy Levels**: From basic encryption to zero-knowledge proofs
- **Stealth Addresses**: One-time addresses for transaction privacy
- **Transaction Mixing**: Temporal obfuscation to prevent correlation
- **Zero-Knowledge Proofs**: Prove transaction validity without revealing details
- **Configurable Security**: Choose your privacy/performance trade-off
- **Low-Cost Privacy**: Solana integration offers 1000x lower fees than Ethereum

## Privacy x402 Protocol

The Privacy x402 Protocol is a comprehensive privacy-preserving transaction protocol that implements:

1. **End-to-End Encryption**: All transaction data is encrypted using NaCl cryptography
2. **Stealth Addresses**: Generate one-time payment addresses for enhanced privacy
3. **Zero-Knowledge Proofs**: Cryptographically prove transaction validity without disclosure
4. **Transaction Mixing**: Batch transactions to prevent timing correlation attacks
5. **Privacy Scoring**: Quantifiable privacy guarantees for each transaction

### Quick Start

```typescript
import { createProtocol, PrivacyLevel } from './src/index';

// Initialize protocol with maximum privacy
const protocol = createProtocol({
  privacyLevel: PrivacyLevel.MAXIMUM,
  enableMixing: true,
  mixingDelayMs: 5000,
});

// Create a privacy-preserving transaction
const tx = await protocol.createTransaction(
  '100.0',                    // amount
  '0x742d35Cc...f0bEb',      // recipient
  { orderType: 'buy' },       // data
  PrivacyLevel.ZERO_KNOWLEDGE // privacy level
);

// Process the transaction
const response = await protocol.processTransaction(tx);
console.log('Privacy Score:', response.privacyScore);
console.log('Transaction Hash:', response.txHash);
```

### Solana Quick Start

```typescript
import { SolanaX402ProtocolHandler, PrivacyLevel } from './src/index';

// Initialize for Solana
const protocol = new SolanaX402ProtocolHandler(
  {
    rpcUrl: 'https://api.devnet.solana.com',
    cluster: 'devnet',
  },
  {
    privacyLevel: PrivacyLevel.MAXIMUM,
    enableMixing: true,
  }
);

// Create Solana privacy transaction
const tx = await protocol.createTransaction(
  '0.1',                      // 0.1 SOL
  'solana_public_key',        // recipient
  { orderType: 'buy' },       // data
  PrivacyLevel.STEALTH        // privacy level
);

const response = await protocol.processTransaction(tx);
console.log('Solana TX:', response.txHash);
console.log('Privacy Score:', response.privacyScore);
```

**See [SOLANA-DEPLOYMENT.md](SOLANA-DEPLOYMENT.md) for complete Solana deployment guide.**

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Run Example

```bash
npm run dev
```

Or run the basic usage example:

```bash
npx ts-node examples/basic-usage.ts
```

## Privacy Levels

| Level | Privacy Features | Privacy Score | Latency |
|-------|-----------------|---------------|---------|
| **NONE** | Public transaction | 0.0 | <10ms |
| **BASIC** | Encryption only | 0.15-0.25 | ~20ms |
| **STEALTH** | + Stealth addresses | 0.40-0.60 | ~50ms |
| **ZERO_KNOWLEDGE** | + ZK proofs | 0.70-0.80 | ~100ms |
| **MAXIMUM** | + Mixing + obfuscation | 0.90-1.00 | ~5000ms |

## Documentation

- [Protocol Specification](PROTOCOL.md) - Detailed technical specification
- [Solana Deployment Guide](SOLANA-DEPLOYMENT.md) - Complete guide for Solana deployment
- [Examples](examples/) - Usage examples and code samples
  - [Basic Usage](examples/basic-usage.ts) - Ethereum examples
  - [Advanced Usage](examples/advanced-usage.ts) - Advanced Ethereum features
  - [Solana Usage](examples/solana-usage.ts) - Solana examples

## Multi-Chain Support

| Feature | Ethereum | Solana |
|---------|----------|--------|
| **Transaction Fee** | $2-50 | $0.0005-0.001 |
| **Confirmation Time** | ~12 seconds | ~400ms |
| **Privacy Cost** | $5-100 | $0.001 |
| **Throughput** | ~15 TPS | 65,000+ TPS |
| **Network** | EVM-compatible | Solana mainnet |

**Solana offers 1000x-100,000x cost reduction while maintaining privacy guarantees!**

## Architecture

```
src/
├── types/
│   └── protocol.ts              # Type definitions and interfaces
├── crypto/
│   ├── encryption.ts            # NaCl encryption utilities
│   ├── stealth.ts               # Ethereum stealth addresses
│   ├── zkproof.ts               # Zero-knowledge proof generation
│   ├── solana-crypto.ts         # Solana cryptography utilities
│   └── solana-stealth.ts        # Solana stealth addresses
├── protocol/
│   ├── x402handler.ts           # Ethereum protocol handler
│   └── solana-x402handler.ts    # Solana protocol handler
└── index.ts                     # Public API exports
```

## Security

The Privacy x402 Protocol uses industry-standard cryptographic primitives:

- **Encryption**: Curve25519 + XSalsa20 + Poly1305 (NaCl)
- **Key Size**: 256 bits
- **Signatures**: Ed25519
- **Hashing**: SHA-512

For detailed security considerations, see [PROTOCOL.md](PROTOCOL.md#security-considerations).

## Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | SUCCESS | Transaction executed successfully |
| 202 | ACCEPTED | Transaction accepted for mixing |
| 4021 | PRIVACY_BREACH | Privacy requirements not met |
| 4022 | INSUFFICIENT_PRIVACY | Privacy score below minimum |
| 4024 | ZK_PROOF_INVALID | Invalid zero-knowledge proof |

## Contributing

Contributions are welcome! Please ensure your code follows the existing style and includes appropriate tests.

## License

MIT

## Author

SterlingENS
