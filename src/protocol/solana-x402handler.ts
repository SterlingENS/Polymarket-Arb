/**
 * Solana Privacy x402 Protocol Handler
 * Solana-specific implementation of the privacy-preserving transaction protocol
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Commitment,
} from '@solana/web3.js';
import {
  X402TransactionRequest,
  X402TransactionResponse,
  X402StatusCode,
  PrivacyLevel,
  PrivacyConfig,
  PrivacyMetadata,
  EncryptedPayload,
} from '../types/protocol';
import {
  generateSolanaKeyPair,
  signMessage,
  verifyMessage,
  encryptForSolana,
  solToLamports,
  generateSolanaTransactionId,
  SolanaKeyPair,
  signSolanaPrivacyData,
  verifySolanaPrivacyData,
} from '../crypto/solana-crypto';
import {
  generateSolanaStealthAddress,
  createSolanaStealthPayment,
  createStealthTransaction,
  SolanaStealthAddress,
} from '../crypto/solana-stealth';
import { generateZKProof, verifyZKProof } from '../crypto/zkproof';
import { hash } from '../crypto/encryption';
import { encodeBase64 } from 'tweetnacl-util';

/**
 * Solana network configuration
 */
export interface SolanaNetworkConfig {
  rpcUrl: string;
  commitment?: Commitment;
  cluster?: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
}

/**
 * Solana-specific transaction pool entry
 */
interface SolanaPooledTransaction {
  request: X402TransactionRequest;
  transaction?: Transaction;
  stealthAddress?: string;
  addedAt: number;
}

/**
 * Solana Privacy x402 Protocol Handler
 */
export class SolanaX402ProtocolHandler {
  private config: PrivacyConfig;
  private keypair: SolanaKeyPair;
  private connection: Connection;
  private transactionPool: Map<string, SolanaPooledTransaction>;
  private mixingTimer: NodeJS.Timeout | null;
  private networkConfig: SolanaNetworkConfig;

  constructor(
    networkConfig: SolanaNetworkConfig,
    config?: Partial<PrivacyConfig>
  ) {
    this.networkConfig = networkConfig;
    this.connection = new Connection(
      networkConfig.rpcUrl,
      networkConfig.commitment || 'confirmed'
    );

    this.config = {
      defaultPrivacyLevel: PrivacyLevel.STEALTH,
      enableStealthAddresses: true,
      enableZKProofs: true,
      enableMixing: true,
      mixingDelayMs: 5000,
      minPrivacyScore: 0.7,
      encryptionAlgorithm: 'nacl',
      ...config,
    };

    this.keypair = generateSolanaKeyPair();
    this.transactionPool = new Map();
    this.mixingTimer = null;

    if (this.config.enableMixing) {
      this.startMixingTimer();
    }
  }

  /**
   * Get Solana public key for encryption
   */
  public getPublicKey(): string {
    return this.keypair.publicKey;
  }

  /**
   * Get Solana keypair
   */
  public getKeypair(): Keypair {
    return this.keypair.keypair;
  }

  /**
   * Get Solana connection
   */
  public getConnection(): Connection {
    return this.connection;
  }

  /**
   * Create a privacy-preserving Solana transaction request
   */
  public async createTransaction(
    amountSol: string,
    recipient: string,
    data: any,
    privacyLevel?: PrivacyLevel
  ): Promise<X402TransactionRequest> {
    const level = privacyLevel ?? this.config.defaultPrivacyLevel;
    const txId = generateSolanaTransactionId();

    // Validate recipient address
    try {
      new PublicKey(recipient);
    } catch {
      throw new Error('Invalid Solana recipient address');
    }

    // Prepare privacy metadata
    const privacyMetadata = await this.preparePrivacyMetadata(
      level,
      recipient,
      data
    );

    // Encrypt the payload
    const payload = this.encryptPayload(JSON.stringify(data));

    // Create transaction request
    const request: X402TransactionRequest = {
      id: txId,
      amount: amountSol,
      recipient,
      privacyMetadata,
      payload,
      timestamp: Date.now(),
      nonce: Date.now(),
    };

    // Sign the request
    request.signature = this.signTransaction(request);

    return request;
  }

  /**
   * Process a Solana transaction with privacy guarantees
   */
  public async processTransaction(
    request: X402TransactionRequest
  ): Promise<X402TransactionResponse> {
    try {
      // Verify signature
      if (!this.verifyTransactionSignature(request)) {
        return this.createErrorResponse(
          request.id,
          X402StatusCode.ENCRYPTION_FAILED,
          'Invalid transaction signature'
        );
      }

      // Check privacy score
      const privacyScore = this.calculatePrivacyScore(request.privacyMetadata);
      if (privacyScore < this.config.minPrivacyScore) {
        return this.createErrorResponse(
          request.id,
          X402StatusCode.INSUFFICIENT_PRIVACY,
          `Privacy score ${privacyScore} below minimum ${this.config.minPrivacyScore}`
        );
      }

      // Verify ZK proof if present
      if (request.privacyMetadata.zkProof) {
        const isValid = verifyZKProof(
          request.privacyMetadata.zkProof,
          this.keypair.keypair.publicKey.toBytes()
        );
        if (!isValid) {
          return this.createErrorResponse(
            request.id,
            X402StatusCode.ZK_PROOF_INVALID,
            'Invalid zero-knowledge proof'
          );
        }
      }

      // Add to mixing pool if enabled
      if (this.config.enableMixing) {
        await this.addToMixingPool(request);
        return {
          id: request.id,
          status: X402StatusCode.ACCEPTED,
          privacyScore,
          message: 'Transaction accepted for mixing',
          timestamp: Date.now(),
        };
      }

      // Process immediately without mixing
      const txHash = await this.executeTransaction(request);

      return {
        id: request.id,
        status: X402StatusCode.SUCCESS,
        txHash,
        privacyScore,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        X402StatusCode.PAYMENT_REQUIRED,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Prepare privacy metadata for Solana transaction
   */
  private async preparePrivacyMetadata(
    level: PrivacyLevel,
    recipient: string,
    data: any
  ): Promise<PrivacyMetadata> {
    const metadata: PrivacyMetadata = {
      privacyLevel: level,
    };

    // Add stealth address for STEALTH level and above
    if (level >= PrivacyLevel.STEALTH && this.config.enableStealthAddresses) {
      const stealthAddr = generateSolanaStealthAddress();
      metadata.stealthAddress = {
        address: stealthAddr.address,
        viewKey: stealthAddr.viewKey,
        spendKey: stealthAddr.spendKey,
        scanKey: stealthAddr.scanKey,
      };
    }

    // Add ZK proof for ZERO_KNOWLEDGE level and above
    if (level >= PrivacyLevel.ZERO_KNOWLEDGE && this.config.enableZKProofs) {
      const secret = hash(JSON.stringify(data));
      const publicInputs = [recipient, Date.now().toString()];
      metadata.zkProof = generateZKProof(
        secret,
        publicInputs,
        this.keypair.keypair.secretKey
      );
    }

    // Add mixing for MAXIMUM level
    if (level >= PrivacyLevel.MAXIMUM && this.config.enableMixing) {
      metadata.mixingFactor = Math.floor(Math.random() * 10) + 5;
      metadata.obfuscationSeed = encodeBase64(
        new Uint8Array(32).map(() => Math.floor(Math.random() * 256))
      );
    }

    return metadata;
  }

  /**
   * Encrypt payload for Solana transaction
   */
  private encryptPayload(data: string): EncryptedPayload {
    const encrypted = encryptForSolana(
      data,
      this.keypair.keypair.publicKey,
      this.keypair.keypair
    );

    return {
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      ephemeralPublicKey: encrypted.ephemeralPublicKey,
      version: '1.0.0',
    };
  }

  /**
   * Calculate privacy score for Solana transaction
   */
  private calculatePrivacyScore(metadata: PrivacyMetadata): number {
    let score = 0.0;

    score += metadata.privacyLevel * 0.15;
    if (metadata.stealthAddress) score += 0.25;
    if (metadata.zkProof) score += 0.3;
    if (metadata.mixingFactor) {
      score += Math.min(metadata.mixingFactor * 0.02, 0.2);
    }
    if (metadata.obfuscationSeed) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Sign Solana transaction request
   */
  private signTransaction(request: X402TransactionRequest): string {
    const dataToSign = {
      id: request.id,
      amount: request.amount,
      recipient: request.recipient,
      timestamp: request.timestamp,
      nonce: request.nonce,
    };

    return signSolanaPrivacyData(dataToSign, this.keypair.keypair);
  }

  /**
   * Verify Solana transaction signature
   */
  private verifyTransactionSignature(request: X402TransactionRequest): boolean {
    if (!request.signature) return false;

    const dataToVerify = {
      id: request.id,
      amount: request.amount,
      recipient: request.recipient,
      timestamp: request.timestamp,
      nonce: request.nonce,
    };

    return verifySolanaPrivacyData(
      dataToVerify,
      request.signature,
      this.keypair.keypair.publicKey
    );
  }

  /**
   * Add transaction to mixing pool
   */
  private async addToMixingPool(
    request: X402TransactionRequest
  ): Promise<void> {
    this.transactionPool.set(request.id, {
      request,
      addedAt: Date.now(),
    });
  }

  /**
   * Start mixing timer
   */
  private startMixingTimer(): void {
    this.mixingTimer = setInterval(() => {
      this.processMixingPool();
    }, this.config.mixingDelayMs);
  }

  /**
   * Process transactions in mixing pool
   */
  private async processMixingPool(): Promise<void> {
    const now = Date.now();
    const readyTransactions: SolanaPooledTransaction[] = [];

    for (const [id, pooled] of this.transactionPool.entries()) {
      if (now - pooled.addedAt >= this.config.mixingDelayMs) {
        readyTransactions.push(pooled);
        this.transactionPool.delete(id);
      }
    }

    // Execute mixed transactions
    for (const pooled of readyTransactions) {
      await this.executeTransaction(pooled.request);
    }
  }

  /**
   * Execute Solana transaction
   */
  private async executeTransaction(
    request: X402TransactionRequest
  ): Promise<string> {
    try {
      const recipientPubkey = new PublicKey(request.recipient);
      const amountLamports = solToLamports(parseFloat(request.amount));

      // Use stealth address if available
      if (
        request.privacyMetadata.stealthAddress &&
        request.privacyMetadata.stealthAddress.viewKey &&
        request.privacyMetadata.stealthAddress.spendKey
      ) {
        const stealthTx = await createStealthTransaction(
          this.connection,
          this.keypair.keypair,
          request.privacyMetadata.stealthAddress.viewKey,
          request.privacyMetadata.stealthAddress.spendKey,
          amountLamports
        );

        const signature = await sendAndConfirmTransaction(
          this.connection,
          stealthTx.transaction,
          [this.keypair.keypair],
          { commitment: 'confirmed' }
        );

        return signature;
      } else {
        // Standard transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: this.keypair.keypair.publicKey,
            toPubkey: recipientPubkey,
            lamports: amountLamports,
          })
        );

        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          [this.keypair.keypair],
          { commitment: 'confirmed' }
        );

        return signature;
      }
    } catch (error) {
      throw new Error(
        `Failed to execute Solana transaction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    id: string,
    code: X402StatusCode,
    message: string
  ): X402TransactionResponse {
    return {
      id,
      status: code,
      privacyScore: 0,
      message,
      timestamp: Date.now(),
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.mixingTimer) {
      clearInterval(this.mixingTimer);
      this.mixingTimer = null;
    }
    this.transactionPool.clear();
  }

  /**
   * Get network info
   */
  public async getNetworkInfo(): Promise<{
    cluster: string;
    version: string;
    slot: number;
  }> {
    const version = await this.connection.getVersion();
    const slot = await this.connection.getSlot();

    return {
      cluster: this.networkConfig.cluster || 'unknown',
      version: version['solana-core'],
      slot,
    };
  }
}
