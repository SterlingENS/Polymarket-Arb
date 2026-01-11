/**
 * Basic Usage Example for Privacy x402 Protocol
 * Demonstrates how to use the protocol for privacy-preserving transactions
 */

import {
  createProtocol,
  PrivacyLevel,
  X402StatusCode,
} from '../src/index';

async function main() {
  console.log('Privacy x402 Protocol - Basic Usage Example\n');

  // Create protocol instance with custom configuration
  const protocol = createProtocol({
    privacyLevel: PrivacyLevel.MAXIMUM,
    enableMixing: true,
    mixingDelayMs: 3000,
  });

  console.log('Protocol initialized with public key:', protocol.getPublicKey());
  console.log();

  // Example 1: Create a basic transaction
  console.log('Example 1: Basic Privacy Transaction');
  const tx1 = await protocol.createTransaction(
    '100.50', // amount
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // recipient
    {
      orderType: 'buy',
      market: 'POLY-USDC',
      price: 0.75,
    },
    PrivacyLevel.BASIC
  );

  console.log('Transaction created:', {
    id: tx1.id,
    amount: tx1.amount,
    privacyLevel: tx1.privacyMetadata.privacyLevel,
  });

  const response1 = await protocol.processTransaction(tx1);
  console.log('Transaction processed:', {
    status: X402StatusCode[response1.status],
    privacyScore: response1.privacyScore,
    txHash: response1.txHash,
  });
  console.log();

  // Example 2: Transaction with Stealth Addresses
  console.log('Example 2: Stealth Address Transaction');
  const tx2 = await protocol.createTransaction(
    '250.00',
    '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    {
      orderType: 'sell',
      market: 'ETH-USDC',
      price: 2500.0,
    },
    PrivacyLevel.STEALTH
  );

  console.log('Transaction with stealth address:', {
    id: tx2.id,
    hasStealthAddress: !!tx2.privacyMetadata.stealthAddress,
    stealthAddress: tx2.privacyMetadata.stealthAddress?.address,
  });

  const response2 = await protocol.processTransaction(tx2);
  console.log('Transaction processed:', {
    status: X402StatusCode[response2.status],
    privacyScore: response2.privacyScore,
  });
  console.log();

  // Example 3: Maximum Privacy Transaction with ZK Proofs
  console.log('Example 3: Maximum Privacy with Zero-Knowledge Proofs');
  const tx3 = await protocol.createTransaction(
    '1000.00',
    '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
    {
      orderType: 'arbitrage',
      markets: ['POLY-USDC', 'ETH-USDC'],
      expectedProfit: 15.5,
    },
    PrivacyLevel.MAXIMUM
  );

  console.log('Maximum privacy transaction:', {
    id: tx3.id,
    hasStealthAddress: !!tx3.privacyMetadata.stealthAddress,
    hasZKProof: !!tx3.privacyMetadata.zkProof,
    hasMixing: !!tx3.privacyMetadata.mixingFactor,
    hasObfuscation: !!tx3.privacyMetadata.obfuscationSeed,
  });

  const response3 = await protocol.processTransaction(tx3);
  console.log('Transaction processed:', {
    status: X402StatusCode[response3.status],
    privacyScore: response3.privacyScore,
    message: response3.message,
  });
  console.log();

  // Wait for mixing to complete
  console.log('Waiting for transaction mixing...');
  await new Promise((resolve) => setTimeout(resolve, 3500));
  console.log('Mixing complete!');
  console.log();

  // Cleanup
  protocol.dispose();
  console.log('Protocol disposed. Example complete.');
}

// Run the example
main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
