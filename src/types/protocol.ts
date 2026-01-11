/**
 * Privacy x402 Protocol Types
 *
 * This protocol implements privacy-preserving transaction handling
 * for Polymarket arbitrage operations using cryptographic techniques.
 */

/**
 * Protocol version following semantic versioning
 */
export const PROTOCOL_VERSION = '1.0.0';

/**
 * x402 Status codes for payment and privacy operations
 */
export enum X402StatusCode {
  PAYMENT_REQUIRED = 402,
  PRIVACY_BREACH = 4021,
  INSUFFICIENT_PRIVACY = 4022,
  ENCRYPTION_FAILED = 4023,
  ZK_PROOF_INVALID = 4024,
  STEALTH_ADDRESS_INVALID = 4025,
  SUCCESS = 200,
  ACCEPTED = 202
}

/**
 * Privacy levels for transactions
 */
export enum PrivacyLevel {
  NONE = 0,           // No privacy (public transaction)
  BASIC = 1,          // Basic encryption
  STEALTH = 2,        // Stealth addressing
  ZERO_KNOWLEDGE = 3, // Full ZK-proof privacy
  MAXIMUM = 4         // All privacy features enabled
}

/**
 * Encrypted payload structure
 */
export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  ephemeralPublicKey: string;
  version: string;
}

/**
 * Stealth address for privacy-preserving transactions
 */
export interface StealthAddress {
  address: string;
  viewKey: string;
  spendKey: string;
  scanKey?: string;
}

/**
 * Zero-knowledge proof structure
 */
export interface ZKProof {
  proof: string;
  publicInputs: string[];
  verificationKey: string;
  timestamp: number;
}

/**
 * Privacy metadata attached to transactions
 */
export interface PrivacyMetadata {
  privacyLevel: PrivacyLevel;
  stealthAddress?: StealthAddress;
  zkProof?: ZKProof;
  mixingFactor?: number;
  obfuscationSeed?: string;
}

/**
 * x402 Protocol transaction request
 */
export interface X402TransactionRequest {
  id: string;
  amount: string;
  recipient: string;
  privacyMetadata: PrivacyMetadata;
  payload: EncryptedPayload;
  timestamp: number;
  nonce: number;
  signature?: string;
}

/**
 * x402 Protocol transaction response
 */
export interface X402TransactionResponse {
  id: string;
  status: X402StatusCode;
  txHash?: string;
  privacyScore: number;
  message?: string;
  timestamp: number;
}

/**
 * Privacy configuration for the protocol
 */
export interface PrivacyConfig {
  defaultPrivacyLevel: PrivacyLevel;
  enableStealthAddresses: boolean;
  enableZKProofs: boolean;
  enableMixing: boolean;
  mixingDelayMs: number;
  minPrivacyScore: number;
  encryptionAlgorithm: 'nacl' | 'aes-256-gcm';
}

/**
 * Protocol error structure
 */
export interface ProtocolError {
  code: X402StatusCode;
  message: string;
  details?: any;
  timestamp: number;
}

/**
 * Key pair for cryptographic operations
 */
export interface CryptoKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * Transaction pool entry for mixing
 */
export interface PooledTransaction {
  request: X402TransactionRequest;
  addedAt: number;
  mixedWith?: string[];
}
