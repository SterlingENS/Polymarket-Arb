/**
 * Privacy x402 Protocol
 * Entry point for the privacy-preserving transaction protocol
 */

export { X402ProtocolHandler } from './protocol/x402handler';

export {
  X402StatusCode,
  PrivacyLevel,
  PROTOCOL_VERSION,
} from './types/protocol';

export type {
  X402TransactionRequest,
  X402TransactionResponse,
  PrivacyConfig,
  PrivacyMetadata,
  StealthAddress,
  ZKProof,
  EncryptedPayload,
  ProtocolError,
} from './types/protocol';

export {
  generateKeyPair,
  encrypt,
  decrypt,
  hash,
  sign,
  verifySignature,
} from './crypto/encryption';

export {
  generateStealthAddress,
  createStealthPayment,
  isTransactionForMe,
} from './crypto/stealth';

export {
  generateZKProof,
  verifyZKProof,
  generateRangeProof,
  generateMembershipProof,
  generateKnowledgeProof,
} from './crypto/zkproof';

/**
 * Create a new Privacy x402 Protocol instance with default configuration
 */
import { X402ProtocolHandler } from './protocol/x402handler';
import { PrivacyLevel } from './types/protocol';

export function createProtocol(config?: {
  privacyLevel?: PrivacyLevel;
  enableMixing?: boolean;
  mixingDelayMs?: number;
}): X402ProtocolHandler {
  return new X402ProtocolHandler({
    defaultPrivacyLevel: config?.privacyLevel ?? PrivacyLevel.STEALTH,
    enableMixing: config?.enableMixing ?? true,
    mixingDelayMs: config?.mixingDelayMs ?? 5000,
  });
}
