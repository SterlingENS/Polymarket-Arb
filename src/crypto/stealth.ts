/**
 * Stealth Address Implementation for Privacy x402 Protocol
 * Implements stealth addresses for transaction privacy
 */

import { ethers } from 'ethers';
import { StealthAddress } from '../types/protocol';
import { hash, randomBytes } from './encryption';
import { encodeBase64 } from 'tweetnacl-util';

/**
 * Generate a stealth address pair
 * Creates a view key and spend key for privacy-preserving transactions
 */
export function generateStealthAddress(): StealthAddress {
  const viewWallet = ethers.Wallet.createRandom();
  const spendWallet = ethers.Wallet.createRandom();

  // Derive stealth address from both keys
  const combinedKey = hash(viewWallet.publicKey + spendWallet.publicKey);
  const stealthWallet = new ethers.Wallet(
    ethers.keccak256(ethers.toUtf8Bytes(combinedKey))
  );

  return {
    address: stealthWallet.address,
    viewKey: viewWallet.privateKey,
    spendKey: spendWallet.privateKey,
    scanKey: encodeBase64(randomBytes(32)),
  };
}

/**
 * Derive a one-time stealth address from master keys
 */
export function deriveOneTimeAddress(
  viewKey: string,
  spendKey: string,
  ephemeralData: string
): StealthAddress {
  const viewWallet = new ethers.Wallet(viewKey);
  const spendWallet = new ethers.Wallet(spendKey);

  // Generate one-time address using ephemeral data
  const combinedData = hash(
    viewWallet.publicKey + spendWallet.publicKey + ephemeralData
  );

  const oneTimeWallet = new ethers.Wallet(
    ethers.keccak256(ethers.toUtf8Bytes(combinedData))
  );

  return {
    address: oneTimeWallet.address,
    viewKey: viewWallet.privateKey,
    spendKey: spendWallet.privateKey,
  };
}

/**
 * Check if a transaction belongs to a stealth address
 */
export function isTransactionForMe(
  viewKey: string,
  spendKey: string,
  transactionData: string,
  targetAddress: string
): boolean {
  try {
    const derived = deriveOneTimeAddress(viewKey, spendKey, transactionData);
    return derived.address.toLowerCase() === targetAddress.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Generate ephemeral key for stealth transaction
 */
export function generateEphemeralKey(): { key: string; publicKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    key: wallet.privateKey,
    publicKey: wallet.publicKey,
  };
}

/**
 * Compute shared secret for stealth address
 */
export function computeSharedSecret(
  privateKey: string,
  publicKey: string
): string {
  const wallet = new ethers.Wallet(privateKey);
  const sharedPoint = hash(wallet.publicKey + publicKey);
  return ethers.keccak256(ethers.toUtf8Bytes(sharedPoint));
}

/**
 * Create a stealth payment address
 */
export function createStealthPayment(
  recipientViewKey: string,
  recipientSpendKey: string
): {
  stealthAddress: string;
  ephemeralPublicKey: string;
  sharedSecret: string;
} {
  const ephemeral = generateEphemeralKey();
  const recipientViewWallet = new ethers.Wallet(recipientViewKey);

  const sharedSecret = computeSharedSecret(
    ephemeral.key,
    recipientViewWallet.publicKey
  );

  const stealth = deriveOneTimeAddress(
    recipientViewKey,
    recipientSpendKey,
    sharedSecret
  );

  return {
    stealthAddress: stealth.address,
    ephemeralPublicKey: ephemeral.publicKey,
    sharedSecret,
  };
}
