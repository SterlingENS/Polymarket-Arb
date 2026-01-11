/**
 * Advanced Usage Example for Privacy x402 Protocol
 * Demonstrates advanced features including custom privacy configurations,
 * stealth payments, and zero-knowledge proofs
 */

import {
  X402ProtocolHandler,
  PrivacyLevel,
  X402StatusCode,
  generateStealthAddress,
  createStealthPayment,
  generateRangeProof,
  generateMembershipProof,
} from '../src/index';

async function demonstrateStealthPayments() {
  console.log('=== Stealth Payment Example ===\n');

  const protocol = new X402ProtocolHandler({
    enableStealthAddresses: true,
    defaultPrivacyLevel: PrivacyLevel.STEALTH,
  });

  // Generate recipient's stealth address keys
  const recipientStealth = generateStealthAddress();
  console.log('Recipient stealth address:', recipientStealth.address);

  // Create a stealth payment
  const stealthPayment = createStealthPayment(
    recipientStealth.viewKey,
    recipientStealth.spendKey
  );

  console.log('Stealth payment created:');
  console.log('  One-time address:', stealthPayment.stealthAddress);
  console.log('  Ephemeral public key:', stealthPayment.ephemeralPublicKey.slice(0, 20) + '...');

  // Create transaction to stealth address
  const tx = await protocol.createTransaction(
    '500.00',
    stealthPayment.stealthAddress,
    {
      type: 'stealth-payment',
      ephemeralKey: stealthPayment.ephemeralPublicKey,
    },
    PrivacyLevel.STEALTH
  );

  const response = await protocol.processTransaction(tx);
  console.log('Transaction status:', X402StatusCode[response.status]);
  console.log('Privacy score:', response.privacyScore);
  console.log();

  protocol.dispose();
}

async function demonstrateZeroKnowledgeProofs() {
  console.log('=== Zero-Knowledge Proof Examples ===\n');

  const protocol = new X402ProtocolHandler({
    enableZKProofs: true,
    defaultPrivacyLevel: PrivacyLevel.ZERO_KNOWLEDGE,
  });

  const signingKeys = require('../src/crypto/zkproof').generateVerificationKey();

  // Example 1: Range Proof (prove amount is within range without revealing it)
  console.log('1. Range Proof Example');
  const tradeAmount = 750.50;
  const rangeProof = generateRangeProof(tradeAmount, 100, 1000, signingKeys.secretKey);

  console.log('Proving amount is between 100-1000 without revealing exact value');
  console.log('Proof generated:', !!rangeProof);
  console.log('Public inputs:', rangeProof.publicInputs);

  // Create transaction with range proof
  const tx1 = await protocol.createTransaction(
    tradeAmount.toString(),
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    {
      type: 'range-proof-payment',
      rangeProof,
    },
    PrivacyLevel.ZERO_KNOWLEDGE
  );

  console.log('Transaction with range proof created:', tx1.id);
  console.log();

  // Example 2: Membership Proof (prove element is in set without revealing which)
  console.log('2. Membership Proof Example');
  const approvedMarkets = ['POLY-USDC', 'ETH-USDC', 'BTC-USDC', 'SOL-USDC'];
  const selectedMarket = 'ETH-USDC';

  const membershipProof = generateMembershipProof(
    selectedMarket,
    approvedMarkets,
    signingKeys.secretKey
  );

  console.log('Proving market is approved without revealing which one');
  console.log('Proof generated:', !!membershipProof);
  console.log('Approved markets count:', approvedMarkets.length);

  const tx2 = await protocol.createTransaction(
    '1000.00',
    '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    {
      type: 'membership-proof-payment',
      membershipProof,
      marketCount: approvedMarkets.length,
    },
    PrivacyLevel.ZERO_KNOWLEDGE
  );

  console.log('Transaction with membership proof created:', tx2.id);
  console.log();

  protocol.dispose();
}

async function demonstratePrivacyScoring() {
  console.log('=== Privacy Score Comparison ===\n');

  const protocol = new X402ProtocolHandler({
    minPrivacyScore: 0.5,
  });

  const testCases = [
    { level: PrivacyLevel.NONE, description: 'No privacy' },
    { level: PrivacyLevel.BASIC, description: 'Basic encryption' },
    { level: PrivacyLevel.STEALTH, description: 'Stealth addresses' },
    { level: PrivacyLevel.ZERO_KNOWLEDGE, description: 'Zero-knowledge proofs' },
    { level: PrivacyLevel.MAXIMUM, description: 'Maximum privacy' },
  ];

  console.log('Privacy Level Comparison:\n');
  console.log('Level'.padEnd(20), 'Score'.padEnd(10), 'Description');
  console.log('-'.repeat(60));

  for (const testCase of testCases) {
    const tx = await protocol.createTransaction(
      '100.00',
      '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
      { test: true },
      testCase.level
    );

    const response = await protocol.processTransaction(tx);

    const levelName = PrivacyLevel[testCase.level].padEnd(20);
    const score = response.privacyScore.toFixed(2).padEnd(10);
    console.log(levelName, score, testCase.description);
  }

  console.log();
  protocol.dispose();
}

async function demonstrateBatchProcessing() {
  console.log('=== Batch Transaction Processing ===\n');

  const protocol = new X402ProtocolHandler({
    enableMixing: true,
    mixingDelayMs: 2000,
    defaultPrivacyLevel: PrivacyLevel.MAXIMUM,
  });

  console.log('Creating batch of 5 transactions for mixing...\n');

  const transactions = [];
  for (let i = 0; i < 5; i++) {
    const tx = await protocol.createTransaction(
      `${100 + i * 50}.00`,
      `0x${Math.random().toString(16).slice(2, 42)}`,
      {
        batch: i + 1,
        orderType: i % 2 === 0 ? 'buy' : 'sell',
      },
      PrivacyLevel.MAXIMUM
    );

    transactions.push(tx);
    console.log(`Transaction ${i + 1} created: ${tx.id}`);
  }

  console.log('\nProcessing batch...');

  const responses = [];
  for (const tx of transactions) {
    const response = await protocol.processTransaction(tx);
    responses.push(response);
    console.log(`Transaction ${tx.id}: ${X402StatusCode[response.status]}`);
  }

  console.log('\nWaiting for mixing to complete...');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  console.log('Batch processing complete!');
  console.log(`Average privacy score: ${(
    responses.reduce((sum, r) => sum + r.privacyScore, 0) / responses.length
  ).toFixed(2)}\n`);

  protocol.dispose();
}

async function main() {
  console.log('Privacy x402 Protocol - Advanced Usage Examples\n');
  console.log('='.repeat(60));
  console.log();

  try {
    await demonstrateStealthPayments();
    await demonstrateZeroKnowledgeProofs();
    await demonstratePrivacyScoring();
    await demonstrateBatchProcessing();

    console.log('='.repeat(60));
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

main();
