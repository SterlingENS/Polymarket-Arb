# Privacy x402 Protocol Specification

## Overview

The Privacy x402 Protocol is a privacy-preserving transaction protocol designed for Polymarket arbitrage operations. It implements multiple layers of privacy protection using state-of-the-art cryptographic techniques.

**Version:** 1.0.0
**Status:** Active Development
**Author:** SterlingENS

## Protocol Name

The "x402" designation refers to:
- **HTTP 402 Payment Required**: The foundational concept of payment protocols
- **Extended (x)**: Enhanced with privacy-preserving features
- **Privacy-First**: Built with privacy as the core principle

## Core Principles

1. **Privacy by Default**: All transactions are encrypted and privacy-preserving
2. **Configurable Privacy Levels**: Users can choose their desired privacy/performance trade-off
3. **Zero-Knowledge Proofs**: Prove transaction validity without revealing details
4. **Stealth Addresses**: One-time addresses for transaction privacy
5. **Transaction Mixing**: Temporal obfuscation to prevent correlation

## Architecture

### Layer Structure

```
┌─────────────────────────────────────────┐
│     Application Layer (Arbitrage)       │
├─────────────────────────────────────────┤
│     Privacy x402 Protocol Handler       │
├─────────────────────────────────────────┤
│  ┌────────────┬──────────┬────────────┐ │
│  │ Encryption │ Stealth  │  ZK Proofs │ │
│  │   Layer    │ Address  │   Layer    │ │
│  └────────────┴──────────┴────────────┘ │
├─────────────────────────────────────────┤
│       Transaction Execution Layer       │
└─────────────────────────────────────────┘
```

## Privacy Levels

The protocol supports five privacy levels:

### Level 0: NONE
- No privacy features
- Public transactions
- Fastest execution
- **Use case**: Testing, public operations

### Level 1: BASIC
- Payload encryption
- Basic transaction obfuscation
- **Use case**: Standard transactions with minimal privacy needs

### Level 2: STEALTH
- All BASIC features
- Stealth address generation
- One-time payment addresses
- **Use case**: Anonymous payments, private transfers

### Level 3: ZERO_KNOWLEDGE
- All STEALTH features
- Zero-knowledge proof generation
- Cryptographic validity proofs without data disclosure
- **Use case**: High-value transactions, regulatory compliance with privacy

### Level 4: MAXIMUM
- All ZERO_KNOWLEDGE features
- Transaction mixing (temporal obfuscation)
- Enhanced obfuscation seeds
- Maximum privacy guarantees
- **Use case**: Maximum privacy requirements, sensitive operations

## Privacy Score Calculation

Each transaction receives a privacy score (0.0 to 1.0) based on:

| Feature | Score Contribution |
|---------|-------------------|
| Privacy Level | 0.15 per level |
| Stealth Address | +0.25 |
| ZK Proof | +0.30 |
| Mixing Factor | +0.02 per factor (max 0.20) |
| Obfuscation Seed | +0.10 |

**Minimum recommended score**: 0.7

## Cryptographic Primitives

### Encryption

- **Algorithm**: NaCl (TweetNaCl implementation)
- **Key Exchange**: Curve25519
- **Symmetric Cipher**: XSalsa20
- **MAC**: Poly1305
- **Key Size**: 256 bits

### Stealth Addresses

Based on Ethereum-compatible addresses with dual-key structure:

```
View Key: For scanning transactions
Spend Key: For spending received funds
Stealth Address: Derived one-time address

Derivation:
  shared_secret = ECDH(view_key, ephemeral_public)
  stealth_address = KDF(spend_key, shared_secret)
```

### Zero-Knowledge Proofs

Simplified ZK proof implementation using Fiat-Shamir heuristic:

```
Commitment: H(secret || public_inputs)
Challenge: H(commitment || public_inputs)
Response: H(secret || challenge)

Verification: Validate structure + signature
```

**Production Note**: For production use, replace with proper ZK-SNARKs (e.g., Groth16, PLONK)

## Transaction Flow

### 1. Transaction Creation

```typescript
const tx = await protocol.createTransaction(
  amount,
  recipient,
  data,
  privacyLevel
);
```

**Steps**:
1. Generate unique transaction ID
2. Prepare privacy metadata (stealth address, ZK proof)
3. Encrypt payload
4. Sign transaction
5. Return transaction request

### 2. Transaction Processing

```typescript
const response = await protocol.processTransaction(tx);
```

**Steps**:
1. Verify transaction signature
2. Calculate privacy score
3. Validate ZK proofs (if present)
4. Add to mixing pool (if enabled) OR execute immediately
5. Return response with status and privacy score

### 3. Transaction Mixing

If mixing is enabled:
- Transactions are added to a mixing pool
- After configured delay (default: 5 seconds), transactions are batched
- Batch execution prevents timing correlation

## Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | SUCCESS | Transaction executed successfully |
| 202 | ACCEPTED | Transaction accepted for mixing |
| 402 | PAYMENT_REQUIRED | Generic payment error |
| 4021 | PRIVACY_BREACH | Privacy requirements not met |
| 4022 | INSUFFICIENT_PRIVACY | Privacy score below minimum |
| 4023 | ENCRYPTION_FAILED | Encryption or decryption error |
| 4024 | ZK_PROOF_INVALID | Invalid zero-knowledge proof |
| 4025 | STEALTH_ADDRESS_INVALID | Invalid stealth address |

## Security Considerations

### Threat Model

**Protected Against**:
- Transaction correlation
- Amount leakage
- Recipient identification
- Timing analysis (with mixing)
- Man-in-the-middle attacks (authenticated encryption)

**Not Protected Against**:
- Network-level traffic analysis
- Compromised endpoints
- Quantum computing attacks (future threat)

### Best Practices

1. **Always use PrivacyLevel.STEALTH or higher** for sensitive operations
2. **Enable transaction mixing** for maximum privacy
3. **Rotate keys regularly** (recommended: weekly)
4. **Monitor privacy scores** - reject transactions below 0.7
5. **Use secure key storage** - never expose secret keys

## Integration Example

```typescript
import { createProtocol, PrivacyLevel } from 'polymarket-arb-privacy-x402';

// Initialize protocol
const protocol = createProtocol({
  privacyLevel: PrivacyLevel.MAXIMUM,
  enableMixing: true,
  mixingDelayMs: 5000,
});

// Create privacy-preserving transaction
const tx = await protocol.createTransaction(
  '100.0',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  { orderType: 'buy', market: 'POLY-USDC' },
  PrivacyLevel.ZERO_KNOWLEDGE
);

// Process transaction
const response = await protocol.processTransaction(tx);

if (response.status === X402StatusCode.SUCCESS) {
  console.log('Transaction hash:', response.txHash);
  console.log('Privacy score:', response.privacyScore);
}

// Cleanup
protocol.dispose();
```

## Performance Characteristics

| Privacy Level | Avg Latency | Privacy Score | Use Case |
|--------------|-------------|---------------|----------|
| NONE | <10ms | 0.0 | Testing only |
| BASIC | ~20ms | 0.15-0.25 | Low-value tx |
| STEALTH | ~50ms | 0.40-0.60 | Standard privacy |
| ZERO_KNOWLEDGE | ~100ms | 0.70-0.80 | High privacy |
| MAXIMUM | ~5000ms* | 0.90-1.00 | Max privacy |

*Includes mixing delay

## Future Enhancements

1. **Ring Signatures**: Enhanced sender anonymity
2. **Confidential Transactions**: Hide transaction amounts
3. **Atomic Swaps**: Privacy-preserving cross-chain swaps
4. **Layer 2 Integration**: ZK-rollup compatibility
5. **Quantum Resistance**: Post-quantum cryptography

## References

- [NaCl Cryptography](https://nacl.cr.yp.to/)
- [Stealth Addresses](https://cryptonote.org/whitepaper.pdf)
- [Zero-Knowledge Proofs](https://z.cash/technology/zksnarks/)
- [HTTP 402 Payment Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)

## License

MIT License - See LICENSE file for details

## Contact

For questions or contributions, please open an issue on the GitHub repository.
