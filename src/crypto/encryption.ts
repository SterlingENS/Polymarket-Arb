/**
 * Encryption utilities for Privacy x402 Protocol
 * Uses NaCl (TweetNaCl) for authenticated encryption
 */

import * as nacl from 'tweetnacl';
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64,
} from 'tweetnacl-util';
import { EncryptedPayload, CryptoKeyPair } from '../types/protocol';

/**
 * Generate a new cryptographic key pair for encryption
 */
export function generateKeyPair(): CryptoKeyPair {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Encrypt data using public key cryptography
 * Uses NaCl box (Curve25519 + XSalsa20 + Poly1305)
 */
export function encrypt(
  data: string,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ephemeralKeyPair = nacl.box.keyPair();

  const messageUint8 = decodeUTF8(data);
  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientPublicKey,
    senderSecretKey
  );

  if (!encrypted) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    ephemeralPublicKey: encodeBase64(ephemeralKeyPair.publicKey),
    version: '1.0.0',
  };
}

/**
 * Decrypt data using private key cryptography
 */
export function decrypt(
  payload: EncryptedPayload,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string {
  const ciphertext = decodeBase64(payload.ciphertext);
  const nonce = decodeBase64(payload.nonce);

  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    senderPublicKey,
    recipientSecretKey
  );

  if (!decrypted) {
    throw new Error('Decryption failed - invalid keys or corrupted data');
  }

  return encodeUTF8(decrypted);
}

/**
 * Hash data using SHA-256 (via NaCl)
 */
export function hash(data: string): string {
  const messageUint8 = decodeUTF8(data);
  const hashed = nacl.hash(messageUint8);
  return encodeBase64(hashed);
}

/**
 * Generate a random nonce
 */
export function generateNonce(): string {
  const nonce = nacl.randomBytes(24);
  return encodeBase64(nonce);
}

/**
 * Sign data using Ed25519
 */
export function sign(data: string, secretKey: Uint8Array): string {
  const messageUint8 = decodeUTF8(data);
  const signature = nacl.sign.detached(messageUint8, secretKey);
  return encodeBase64(signature);
}

/**
 * Verify signature using Ed25519
 */
export function verifySignature(
  data: string,
  signature: string,
  publicKey: Uint8Array
): boolean {
  const messageUint8 = decodeUTF8(data);
  const signatureUint8 = decodeBase64(signature);
  return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKey);
}

/**
 * Derive a deterministic key from a seed
 */
export function deriveKey(seed: string): CryptoKeyPair {
  const seedHash = nacl.hash(decodeUTF8(seed));
  const keyPair = nacl.box.keyPair.fromSecretKey(seedHash.slice(0, 32));
  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Securely generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return nacl.randomBytes(length);
}
