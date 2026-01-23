/**
 * Solana Usage Example for Privacy x402 Protocol
 * Demonstrates how to use the protocol on Solana network
 */

import { clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaX402ProtocolHandler } from '../src/protocol/solana-x402handler';
import { PrivacyLevel, X402StatusCode } from '../src/types/protocol';
import {
  generateSolanaStealthAddress,
  createSolanaStealthPayment,
} from '../src/crypto/solana-stealth';
import { generateSolanaKeyPair, lamportsToSol } from '../src/crypto/solana-crypto';

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(NETWORK as any);

async function main() {
  console.log('Privacy x402 Protocol - Solana Usage Example\n');
  console.log('='.repeat(60));
  console.log();

  // Initialize protocol
  console.log(`Connecting to Solana ${NETWORK}...`);
  const protocol = new SolanaX402ProtocolHandler(
    {
      rpcUrl: RPC_URL,
      cluster: NETWORK as any,
      commitment: 'confirmed',
    },
    {
      defaultPrivacyLevel: PrivacyLevel.STEALTH,
      enableStealthAddresses: true,
      enableZKProofs: true,
      enableMixing: false, // Disable for demo
      minPrivacyScore: 0.5,
    }
  );

  console.log('Protocol initialized!');
  console.log(`Public Key: ${protocol.getPublicKey()}`);
  console.log();

  // Get network info
  const networkInfo = await protocol.getNetworkInfo();
  console.log('Network Info:');
  console.log(`  Cluster: ${networkInfo.cluster}`);
  console.log(`  Version: ${networkInfo.version}`);
  console.log(`  Slot: ${networkInfo.slot}`);
  console.log();

  // Check balance
  const balance = await protocol
    .getConnection()
    .getBalance(protocol.getKeypair().publicKey);
  console.log(`Account balance: ${lamportsToSol(balance)} SOL`);
  console.log();

  // Example 1: Basic Privacy Transaction
  console.log('Example 1: Basic Privacy Transaction');
  console.log('-'.repeat(60));

  const recipient1 = generateSolanaKeyPair();
  console.log(`Recipient: ${recipient1.publicKey}`);

  try {
    const tx1 = await protocol.createTransaction(
      '0.001', // 0.001 SOL
      recipient1.publicKey,
      {
        orderType: 'buy',
        market: 'SOL-USDC',
        price: 100.5,
      },
      PrivacyLevel.BASIC
    );

    console.log('Transaction created:');
    console.log(`  ID: ${tx1.id}`);
    console.log(`  Amount: ${tx1.amount} SOL`);
    console.log(`  Privacy Level: ${PrivacyLevel[tx1.privacyMetadata.privacyLevel]}`);
    console.log(`  Encrypted: ${!!tx1.payload.ciphertext}`);

    // Note: Actual execution requires funded account
    console.log('\nNote: Transaction created but not executed (requires funded account)');
  } catch (error) {
    console.log('Transaction creation:', error instanceof Error ? error.message : error);
  }
  console.log();

  // Example 2: Stealth Address Transaction
  console.log('Example 2: Stealth Address Transaction');
  console.log('-'.repeat(60));

  const stealthAddr = generateSolanaStealthAddress();
  console.log('Generated Solana stealth address:');
  console.log(`  Address: ${stealthAddr.address}`);
  console.log(`  View Key: ${stealthAddr.viewKey.slice(0, 20)}...`);
  console.log(`  Spend Key: ${stealthAddr.spendKey.slice(0, 20)}...`);

  try {
    const tx2 = await protocol.createTransaction(
      '0.002',
      stealthAddr.address,
      {
        orderType: 'sell',
        market: 'SOL-USDC',
        confidential: true,
      },
      PrivacyLevel.STEALTH
    );

    console.log('\nStealth transaction created:');
    console.log(`  ID: ${tx2.id}`);
    console.log(`  Amount: ${tx2.amount} SOL`);
    console.log(`  Has Stealth Address: ${!!tx2.privacyMetadata.stealthAddress}`);

    // Calculate privacy score
    const privacyScore =
      tx2.privacyMetadata.privacyLevel * 0.15 +
      (tx2.privacyMetadata.stealthAddress ? 0.25 : 0);
    console.log(`  Privacy Score: ${privacyScore.toFixed(2)}`);
  } catch (error) {
    console.log('Transaction creation:', error instanceof Error ? error.message : error);
  }
  console.log();

  // Example 3: Maximum Privacy with ZK Proofs
  console.log('Example 3: Maximum Privacy with Zero-Knowledge Proofs');
  console.log('-'.repeat(60));

  const recipient3 = generateSolanaKeyPair();

  try {
    const tx3 = await protocol.createTransaction(
      '0.005',
      recipient3.publicKey,
      {
        orderType: 'arbitrage',
        markets: ['SOL-USDC', 'SOL-USDT'],
        expectedProfit: 0.002,
        strategy: 'triangular',
      },
      PrivacyLevel.MAXIMUM
    );

    console.log('Maximum privacy transaction created:');
    console.log(`  ID: ${tx3.id}`);
    console.log(`  Amount: ${tx3.amount} SOL`);
    console.log(`  Privacy Level: ${PrivacyLevel[tx3.privacyMetadata.privacyLevel]}`);
    console.log(`  Has Stealth Address: ${!!tx3.privacyMetadata.stealthAddress}`);
    console.log(`  Has ZK Proof: ${!!tx3.privacyMetadata.zkProof}`);
    console.log(`  Mixing Factor: ${tx3.privacyMetadata.mixingFactor || 'N/A'}`);
    console.log(`  Has Obfuscation: ${!!tx3.privacyMetadata.obfuscationSeed}`);

    if (tx3.privacyMetadata.zkProof) {
      console.log('\nZK Proof Details:');
      console.log(`  Public Inputs: ${tx3.privacyMetadata.zkProof.publicInputs.length}`);
      console.log(`  Timestamp: ${new Date(tx3.privacyMetadata.zkProof.timestamp).toISOString()}`);
    }
  } catch (error) {
    console.log('Transaction creation:', error instanceof Error ? error.message : error);
  }
  console.log();

  // Example 4: Stealth Payment Flow
  console.log('Example 4: Complete Stealth Payment Flow');
  console.log('-'.repeat(60));

  // Recipient generates stealth address keys
  const recipientStealthKeys = generateSolanaStealthAddress();
  console.log('Recipient generated stealth keys');
  console.log(`  Public Address: ${recipientStealthKeys.address}`);

  // Sender creates stealth payment
  const stealthPayment = createSolanaStealthPayment(
    recipientStealthKeys.viewKey,
    recipientStealthKeys.spendKey
  );

  console.log('\nSender created stealth payment:');
  console.log(`  Stealth Address: ${stealthPayment.stealthAddress.address}`);
  console.log(`  Ephemeral Key: ${stealthPayment.ephemeralPublicKey}`);
  console.log(`  Shared Secret: ${stealthPayment.sharedSecret.slice(0, 20)}...`);

  console.log('\nPayment sent to one-time stealth address!');
  console.log('Recipient can scan and recover funds using view and spend keys.');
  console.log();

  // Example 5: Privacy Score Comparison
  console.log('Example 5: Privacy Score Comparison Across Levels');
  console.log('-'.repeat(60));

  const levels = [
    PrivacyLevel.NONE,
    PrivacyLevel.BASIC,
    PrivacyLevel.STEALTH,
    PrivacyLevel.ZERO_KNOWLEDGE,
    PrivacyLevel.MAXIMUM,
  ];

  console.log('\nLevel'.padEnd(20) + 'Features'.padEnd(40) + 'Est. Score');
  console.log('-'.repeat(70));

  for (const level of levels) {
    const features = [];
    if (level >= PrivacyLevel.BASIC) features.push('Encryption');
    if (level >= PrivacyLevel.STEALTH) features.push('Stealth Addr');
    if (level >= PrivacyLevel.ZERO_KNOWLEDGE) features.push('ZK Proofs');
    if (level >= PrivacyLevel.MAXIMUM) features.push('Mixing', 'Obfuscation');

    const score =
      level * 0.15 +
      (level >= PrivacyLevel.STEALTH ? 0.25 : 0) +
      (level >= PrivacyLevel.ZERO_KNOWLEDGE ? 0.3 : 0) +
      (level >= PrivacyLevel.MAXIMUM ? 0.3 : 0);

    console.log(
      PrivacyLevel[level].padEnd(20) +
        (features.join(', ') || 'None').padEnd(40) +
        score.toFixed(2)
    );
  }
  console.log();

  // Cleanup
  protocol.dispose();

  console.log('='.repeat(60));
  console.log('\nExamples completed successfully!');
  console.log('\nTo execute transactions:');
  console.log('1. Fund your Solana account with SOL');
  console.log('2. Set SOLANA_KEYPAIR_PATH environment variable');
  console.log('3. Enable transaction execution in the code');
  console.log('\nFor devnet testing:');
  console.log(`  solana airdrop 1 ${protocol.getPublicKey()} --url devnet`);
}

main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
