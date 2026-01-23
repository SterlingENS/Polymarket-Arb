/**
 * Solana-specific cryptography utilities for Privacy x402 Protocol
 * Uses Solana's Ed25519 keypairs and account system
 */

import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, decodeUTF8, encodeUTF8 } from 'tweetnacl-util';
import { hash } from './encryption';
import bs58 from 'bs58';

/**
 * Solana keypair wrapper
 */
export interface SolanaKeyPair {
  keypair: Keypair;
  publicKey: string;
  secretKey: Uint8Array;
}

/**
 * Generate a new Solana keypair
 */
export function generateSolanaKeyPair(): SolanaKeyPair {
  const keypair = Keypair.generate();
  return {
    keypair,
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
}

/**
 * Create Solana keypair from secret key
 */
export function keypairFromSecret(secretKey: Uint8Array): SolanaKeyPair {
  const keypair = Keypair.fromSecretKey(secretKey);
  return {
    keypair,
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
}

/**
 * Create Solana keypair from base58 secret
 */
export function keypairFromBase58(secret: string): SolanaKeyPair {
  const secretKey = bs58.decode(secret);
  return keypairFromSecret(secretKey);
}

/**
 * Derive a deterministic Solana keypair from a seed
 */
export function deriveSolanaKeyPair(seed: string): SolanaKeyPair {
  const seedHash = nacl.hash(decodeUTF8(seed));
  const keypair = Keypair.fromSeed(seedHash.slice(0, 32));
  return {
    keypair,
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
}

/**
 * Sign a message with Solana keypair
 */
export function signMessage(message: string, keypair: Keypair): string {
  const messageBytes = decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  return encodeBase64(signature);
}

/**
 * Verify a signed message
 */
export function verifyMessage(
  message: string,
  signature: string,
  publicKey: PublicKey
): boolean {
  const messageBytes = decodeUTF8(message);
  const signatureBytes = decodeBase64(signature);
  return nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKey.toBytes()
  );
}

/**
 * Encrypt data for a Solana public key using NaCl box
 */
export function encryptForSolana(
  data: string,
  recipientPublicKey: PublicKey,
  senderKeypair: Keypair
): {
  ciphertext: string;
  nonce: string;
  ephemeralPublicKey: string;
} {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // Convert Ed25519 keys to Curve25519 for encryption
  const senderBox = nacl.box.keyPair.fromSecretKey(
    senderKeypair.secretKey.slice(0, 32)
  );
  const recipientBox = convertEd25519ToCurve25519Public(
    recipientPublicKey.toBytes()
  );

  const messageUint8 = decodeUTF8(data);
  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientBox,
    senderBox.secretKey
  );

  if (!encrypted) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    ephemeralPublicKey: encodeBase64(senderBox.publicKey),
  };
}

/**
 * Decrypt data encrypted for Solana
 */
export function decryptForSolana(
  ciphertext: string,
  nonce: string,
  ephemeralPublicKey: string,
  recipientKeypair: Keypair
): string {
  const ciphertextBytes = decodeBase64(ciphertext);
  const nonceBytes = decodeBase64(nonce);
  const ephemeralKeyBytes = decodeBase64(ephemeralPublicKey);

  // Convert Ed25519 keys to Curve25519 for decryption
  const recipientBox = nacl.box.keyPair.fromSecretKey(
    recipientKeypair.secretKey.slice(0, 32)
  );

  const decrypted = nacl.box.open(
    ciphertextBytes,
    nonceBytes,
    ephemeralKeyBytes,
    recipientBox.secretKey
  );

  if (!decrypted) {
    throw new Error('Decryption failed');
  }

  return encodeUTF8(decrypted);
}

/**
 * Convert Ed25519 public key to Curve25519 (for encryption)
 * This is a simplified conversion - in production use a proper library
 */
function convertEd25519ToCurve25519Public(
  ed25519PublicKey: Uint8Array
): Uint8Array {
  // For simplicity, we hash and use first 32 bytes
  // In production, use proper Ed25519 to Curve25519 conversion
  const hashed = nacl.hash(ed25519PublicKey);
  return hashed.slice(0, 32);
}

/**
 * Create a Program Derived Address (PDA) for privacy accounts
 */
export function createPrivacyPDA(
  programId: PublicKey,
  seeds: (string | Uint8Array)[]
): PublicKey {
  const seedsBytes = seeds.map((seed) =>
    typeof seed === 'string' ? decodeUTF8(seed) : seed
  );

  const [pda] = PublicKey.findProgramAddressSync(seedsBytes, programId);
  return pda;
}

/**
 * Generate a random Solana account for privacy
 */
export function generatePrivacyAccount(): {
  keypair: Keypair;
  publicKey: string;
  base58Secret: string;
} {
  const keypair = Keypair.generate();
  return {
    keypair,
    publicKey: keypair.publicKey.toBase58(),
    base58Secret: bs58.encode(keypair.secretKey),
  };
}

/**
 * Hash a Solana transaction for privacy tracking
 */
export function hashSolanaTransaction(tx: Transaction): string {
  const serialized = tx.serialize({ requireAllSignatures: false });
  return hash(encodeBase64(serialized));
}

/**
 * Create a privacy signature for Solana transaction
 */
export function signSolanaPrivacyData(
  data: any,
  keypair: Keypair
): string {
  const dataString = JSON.stringify(data);
  return signMessage(dataString, keypair);
}

/**
 * Verify Solana privacy signature
 */
export function verifySolanaPrivacyData(
  data: any,
  signature: string,
  publicKey: PublicKey
): boolean {
  const dataString = JSON.stringify(data);
  return verifyMessage(dataString, signature, publicKey);
}

/**
 * Convert SOL amount to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Generate a unique transaction ID for Solana
 */
export function generateSolanaTransactionId(): string {
  const timestamp = Date.now();
  const random = encodeBase64(nacl.randomBytes(16));
  return `sol_${timestamp}_${random}`;
}
