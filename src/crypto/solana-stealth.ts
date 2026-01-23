/**
 * Solana Stealth Address Implementation for Privacy x402 Protocol
 * Implements stealth addresses for Solana transactions
 */

import { Keypair, PublicKey, Connection, SystemProgram, Transaction } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { encodeBase64, decodeUTF8 } from 'tweetnacl-util';
import { hash } from './encryption';
import bs58 from 'bs58';

/**
 * Solana stealth address structure
 */
export interface SolanaStealthAddress {
  address: string;
  publicKey: PublicKey;
  viewKey: string;
  spendKey: string;
  scanKey?: string;
}

/**
 * Generate a new Solana stealth address pair
 */
export function generateSolanaStealthAddress(): SolanaStealthAddress {
  const viewKeypair = Keypair.generate();
  const spendKeypair = Keypair.generate();

  // Derive stealth address from both keys
  const combinedKey = hash(
    viewKeypair.publicKey.toBase58() + spendKeypair.publicKey.toBase58()
  );

  // Use the hash to derive a deterministic keypair
  const stealthSeed = nacl.hash(decodeUTF8(combinedKey)).slice(0, 32);
  const stealthKeypair = Keypair.fromSeed(stealthSeed);

  return {
    address: stealthKeypair.publicKey.toBase58(),
    publicKey: stealthKeypair.publicKey,
    viewKey: bs58.encode(viewKeypair.secretKey),
    spendKey: bs58.encode(spendKeypair.secretKey),
    scanKey: encodeBase64(nacl.randomBytes(32)),
  };
}

/**
 * Derive a one-time Solana stealth address
 */
export function deriveOneTimeSolanaAddress(
  viewKey: string,
  spendKey: string,
  ephemeralData: string
): SolanaStealthAddress {
  const viewKeypair = Keypair.fromSecretKey(bs58.decode(viewKey));
  const spendKeypair = Keypair.fromSecretKey(bs58.decode(spendKey));

  // Generate one-time address using ephemeral data
  const combinedData = hash(
    viewKeypair.publicKey.toBase58() +
      spendKeypair.publicKey.toBase58() +
      ephemeralData
  );

  const oneTimeSeed = nacl.hash(decodeUTF8(combinedData)).slice(0, 32);
  const oneTimeKeypair = Keypair.fromSeed(oneTimeSeed);

  return {
    address: oneTimeKeypair.publicKey.toBase58(),
    publicKey: oneTimeKeypair.publicKey,
    viewKey,
    spendKey,
  };
}

/**
 * Check if a Solana transaction belongs to a stealth address
 */
export function isSolanaTransactionForMe(
  viewKey: string,
  spendKey: string,
  transactionData: string,
  targetAddress: string
): boolean {
  try {
    const derived = deriveOneTimeSolanaAddress(viewKey, spendKey, transactionData);
    return derived.address === targetAddress;
  } catch {
    return false;
  }
}

/**
 * Generate ephemeral keypair for Solana stealth transaction
 */
export function generateSolanaEphemeralKey(): {
  keypair: Keypair;
  publicKey: string;
  privateKey: string;
} {
  const keypair = Keypair.generate();
  return {
    keypair,
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
}

/**
 * Compute shared secret for Solana stealth address
 */
export function computeSolanaSharedSecret(
  privateKey: string,
  publicKey: string
): string {
  const privateKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const sharedPoint = hash(
    privateKeypair.publicKey.toBase58() + publicKey
  );
  return sharedPoint;
}

/**
 * Create a Solana stealth payment
 */
export function createSolanaStealthPayment(
  recipientViewKey: string,
  recipientSpendKey: string
): {
  stealthAddress: SolanaStealthAddress;
  ephemeralPublicKey: string;
  sharedSecret: string;
  keypair: Keypair;
} {
  const ephemeral = generateSolanaEphemeralKey();
  const recipientViewKeypair = Keypair.fromSecretKey(bs58.decode(recipientViewKey));

  const sharedSecret = computeSolanaSharedSecret(
    ephemeral.privateKey,
    recipientViewKeypair.publicKey.toBase58()
  );

  const stealth = deriveOneTimeSolanaAddress(
    recipientViewKey,
    recipientSpendKey,
    sharedSecret
  );

  return {
    stealthAddress: stealth,
    ephemeralPublicKey: ephemeral.publicKey,
    sharedSecret,
    keypair: ephemeral.keypair,
  };
}

/**
 * Scan for incoming stealth payments on Solana
 */
export async function scanForStealthPayments(
  connection: Connection,
  viewKey: string,
  spendKey: string,
  signatures: string[]
): Promise<
  Array<{
    signature: string;
    stealthAddress: string;
    amount?: number;
  }>
> {
  const foundPayments = [];

  for (const signature of signatures) {
    try {
      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta) continue;

      // Check if this transaction is for our stealth address
      const txData = signature; // Use signature as unique identifier
      const derived = deriveOneTimeSolanaAddress(viewKey, spendKey, txData);

      // Check if any account matches our derived address
      const accountKeys = tx.transaction.message.getAccountKeys();
      for (const key of accountKeys.staticAccountKeys) {
        if (key.toBase58() === derived.address) {
          foundPayments.push({
            signature,
            stealthAddress: derived.address,
            amount: tx.meta.postBalances[0] - tx.meta.preBalances[0],
          });
          break;
        }
      }
    } catch (error) {
      // Skip failed transactions
      continue;
    }
  }

  return foundPayments;
}

/**
 * Create a Solana transaction to a stealth address
 */
export async function createStealthTransaction(
  connection: Connection,
  fromKeypair: Keypair,
  recipientViewKey: string,
  recipientSpendKey: string,
  amountLamports: number
): Promise<{
  transaction: Transaction;
  stealthAddress: string;
  ephemeralPublicKey: string;
}> {
  const stealthPayment = createSolanaStealthPayment(
    recipientViewKey,
    recipientSpendKey
  );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: stealthPayment.stealthAddress.publicKey,
      lamports: amountLamports,
    })
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromKeypair.publicKey;

  return {
    transaction,
    stealthAddress: stealthPayment.stealthAddress.address,
    ephemeralPublicKey: stealthPayment.ephemeralPublicKey,
  };
}

/**
 * Recover funds from a stealth address
 */
export function recoverStealthKeypair(
  viewKey: string,
  spendKey: string,
  ephemeralData: string
): Keypair {
  const stealth = deriveOneTimeSolanaAddress(viewKey, spendKey, ephemeralData);

  // Reconstruct the keypair
  const viewKeypair = Keypair.fromSecretKey(bs58.decode(viewKey));
  const spendKeypair = Keypair.fromSecretKey(bs58.decode(spendKey));

  const combinedData = hash(
    viewKeypair.publicKey.toBase58() +
      spendKeypair.publicKey.toBase58() +
      ephemeralData
  );

  const seed = nacl.hash(decodeUTF8(combinedData)).slice(0, 32);
  return Keypair.fromSeed(seed);
}

/**
 * Generate stealth meta-address (for publishing)
 */
export function generateStealthMetaAddress(
  viewKey: string,
  spendKey: string
): {
  metaAddress: string;
  viewPublicKey: string;
  spendPublicKey: string;
} {
  const viewKeypair = Keypair.fromSecretKey(bs58.decode(viewKey));
  const spendKeypair = Keypair.fromSecretKey(bs58.decode(spendKey));

  const metaAddress = hash(
    viewKeypair.publicKey.toBase58() + spendKeypair.publicKey.toBase58()
  );

  return {
    metaAddress,
    viewPublicKey: viewKeypair.publicKey.toBase58(),
    spendPublicKey: spendKeypair.publicKey.toBase58(),
  };
}
