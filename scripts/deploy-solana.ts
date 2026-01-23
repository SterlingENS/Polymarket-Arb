/**
 * Solana Deployment Script for Privacy x402 Protocol
 * Deploys and configures the protocol on Solana network
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from '@solana/web3.js';
import { SolanaX402ProtocolHandler } from '../src/protocol/solana-x402handler';
import { PrivacyLevel } from '../src/types/protocol';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(NETWORK as any);
const KEYPAIR_PATH = process.env.SOLANA_KEYPAIR_PATH || '';

/**
 * Load or generate keypair
 */
function loadOrGenerateKeypair(): Keypair {
  if (KEYPAIR_PATH && fs.existsSync(KEYPAIR_PATH)) {
    console.log(`Loading keypair from ${KEYPAIR_PATH}...`);
    const secretKey = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  }

  console.log('Generating new keypair...');
  const keypair = Keypair.generate();

  // Save keypair
  const keysDir = path.join(__dirname, '../keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const keyPath = path.join(keysDir, `solana-keypair-${Date.now()}.json`);
  fs.writeFileSync(
    keyPath,
    JSON.stringify(Array.from(keypair.secretKey)),
    'utf-8'
  );

  console.log(`Keypair saved to ${keyPath}`);
  console.log(`Public Key: ${keypair.publicKey.toBase58()}`);

  return keypair;
}

/**
 * Request airdrop for devnet/testnet
 */
async function requestAirdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number
): Promise<void> {
  if (NETWORK === 'mainnet-beta') {
    console.log('Skipping airdrop on mainnet');
    return;
  }

  console.log(`Requesting airdrop of ${amount} SOL...`);
  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    console.log('Airdrop confirmed!');
  } catch (error) {
    console.warn('Airdrop failed:', error);
  }
}

/**
 * Deploy protocol
 */
async function deploy() {
  console.log('='.repeat(60));
  console.log('Privacy x402 Protocol - Solana Deployment');
  console.log('='.repeat(60));
  console.log();

  console.log(`Network: ${NETWORK}`);
  console.log(`RPC URL: ${RPC_URL}`);
  console.log();

  // Create connection
  const connection = new Connection(RPC_URL, 'confirmed');
  console.log('Connected to Solana network');

  // Check network version
  const version = await connection.getVersion();
  console.log(`Solana version: ${version['solana-core']}`);
  console.log();

  // Initialize protocol
  console.log('Initializing Privacy x402 Protocol...');
  const protocol = new SolanaX402ProtocolHandler(
    {
      rpcUrl: RPC_URL,
      cluster: NETWORK as any,
      commitment: 'confirmed',
    },
    {
      defaultPrivacyLevel: PrivacyLevel.MAXIMUM,
      enableStealthAddresses: true,
      enableZKProofs: true,
      enableMixing: true,
      mixingDelayMs: 5000,
      minPrivacyScore: 0.7,
    }
  );

  console.log('Protocol initialized successfully!');
  console.log(`Protocol Public Key: ${protocol.getPublicKey()}`);
  console.log();

  // Check balance
  const balance = await connection.getBalance(protocol.getKeypair().publicKey);
  console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  // Request airdrop if needed
  if (balance < 0.1 * LAMPORTS_PER_SOL && NETWORK !== 'mainnet-beta') {
    await requestAirdrop(connection, protocol.getKeypair().publicKey, 1);
    const newBalance = await connection.getBalance(
      protocol.getKeypair().publicKey
    );
    console.log(`New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
  }
  console.log();

  // Get network info
  const networkInfo = await protocol.getNetworkInfo();
  console.log('Network Info:');
  console.log(`  Cluster: ${networkInfo.cluster}`);
  console.log(`  Version: ${networkInfo.version}`);
  console.log(`  Current Slot: ${networkInfo.slot}`);
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: protocol.getPublicKey(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    config: {
      defaultPrivacyLevel: PrivacyLevel[PrivacyLevel.MAXIMUM],
      enableStealthAddresses: true,
      enableZKProofs: true,
      enableMixing: true,
      mixingDelayMs: 5000,
      minPrivacyScore: 0.7,
    },
  };

  const deployDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  const deployPath = path.join(
    deployDir,
    `solana-${NETWORK}-${Date.now()}.json`
  );
  fs.writeFileSync(deployPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`Deployment info saved to ${deployPath}`);
  console.log();

  console.log('='.repeat(60));
  console.log('Deployment Complete!');
  console.log('='.repeat(60));
  console.log();
  console.log('Next Steps:');
  console.log('1. Fund your account with SOL for transaction fees');
  console.log('2. Run the example: npm run example:solana');
  console.log('3. Integrate with your arbitrage bot');
  console.log();

  protocol.dispose();
}

// Run deployment
deploy().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
