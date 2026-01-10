import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { TradingFund } from "../target/types/trading_fund";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

export class FundClient {
  private program: Program<TradingFund>;
  private provider: anchor.AnchorProvider;
  private wallet: Keypair;
  private fundStatePDA: PublicKey;
  private vaultPDA: PublicKey;
  private fundTokenMintPDA: PublicKey;
  private fundTokenVaultPDA: PublicKey;

  constructor(connection: Connection, programId: PublicKey, walletKeypair: Keypair) {
    const wallet = new anchor.Wallet(walletKeypair);
    this.provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(this.provider);

    this.program = new Program(
      require("../target/idl/trading_fund.json"),
      programId,
      this.provider
    ) as Program<TradingFund>;

    this.wallet = walletKeypair;

    // Derive PDAs
    [this.fundStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_state")],
      this.program.programId
    );

    [this.vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      this.program.programId
    );

    [this.fundTokenMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_token")],
      this.program.programId
    );

    [this.fundTokenVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_token_vault")],
      this.program.programId
    );
  }

  /**
   * Initialize the fund (only needs to be done once)
   */
  async initialize(): Promise<string> {
    console.log("🏗️  Initializing trading fund...");

    try {
      const tx = await this.program.methods
        .initialize(9) // 9 decimals for fund token
        .accounts({
          fundState: this.fundStatePDA,
          vault: this.vaultPDA,
          fundTokenMint: this.fundTokenMintPDA,
          fundTokenVault: this.fundTokenVaultPDA,
          authority: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([this.wallet])
        .rpc();

      console.log("✅ Fund initialized!");
      console.log(`📝 Transaction: ${tx}`);
      console.log(`💎 Fund Token Mint: ${this.fundTokenMintPDA.toString()}`);

      return tx;
    } catch (error) {
      console.error("Failed to initialize fund:", error);
      throw error;
    }
  }

  /**
   * Deposit SOL into the fund
   */
  async deposit(amountSOL: number): Promise<string> {
    console.log(`💰 Depositing ${amountSOL} SOL...`);

    const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

    const [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    try {
      const tx = await this.program.methods
        .deposit(new anchor.BN(amountLamports))
        .accounts({
          fundState: this.fundStatePDA,
          vault: this.vaultPDA,
          userAccount: userAccountPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.wallet])
        .rpc();

      console.log("✅ Deposit successful!");
      console.log(`📝 Transaction: ${tx}`);

      // Show updated balance
      await this.getBalance();

      return tx;
    } catch (error) {
      console.error("Failed to deposit:", error);
      throw error;
    }
  }

  /**
   * Withdraw from the fund by burning shares
   */
  async withdraw(shares: number): Promise<string> {
    console.log(`📤 Withdrawing ${shares} shares...`);

    const [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    try {
      const tx = await this.program.methods
        .withdraw(new anchor.BN(shares))
        .accounts({
          fundState: this.fundStatePDA,
          vault: this.vaultPDA,
          userAccount: userAccountPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([this.wallet])
        .rpc();

      console.log("✅ Withdrawal successful!");
      console.log(`📝 Transaction: ${tx}`);

      return tx;
    } catch (error) {
      console.error("Failed to withdraw:", error);
      throw error;
    }
  }

  /**
   * Claim fund tokens earned from profits
   */
  async claimFundTokens(amount: number): Promise<string> {
    console.log(`💎 Claiming ${amount} fund tokens...`);

    const [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    // Get or create associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      this.fundTokenMintPDA,
      this.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .claimFundTokens(new anchor.BN(amount))
        .accounts({
          fundState: this.fundStatePDA,
          fundTokenVault: this.fundTokenVaultPDA,
          userAccount: userAccountPDA,
          userTokenAccount,
          user: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([this.wallet])
        .rpc();

      console.log("✅ Fund tokens claimed!");
      console.log(`📝 Transaction: ${tx}`);

      return tx;
    } catch (error) {
      console.error("Failed to claim fund tokens:", error);
      throw error;
    }
  }

  /**
   * Get user's balance and shares
   */
  async getBalance(): Promise<void> {
    const [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    try {
      const userAccount = await this.program.account.userAccount.fetch(userAccountPDA);
      const fundState = await this.program.account.fundState.fetch(this.fundStatePDA);

      // Calculate user's portion of the fund
      const sharePercentage =
        fundState.totalShares.toNumber() > 0
          ? (userAccount.shares.toNumber() / fundState.totalShares.toNumber()) * 100
          : 0;

      const userValue =
        fundState.totalShares.toNumber() > 0
          ? (userAccount.shares.toNumber() * fundState.totalValue.toNumber()) /
            fundState.totalShares.toNumber()
          : 0;

      console.log("\n👤 Your Balance:");
      console.log("================================");
      console.log(`Shares: ${userAccount.shares.toString()}`);
      console.log(`Total Deposited: ${userAccount.totalDeposited.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`Current Value: ${userValue / LAMPORTS_PER_SOL} SOL`);
      console.log(`Fund Ownership: ${sharePercentage.toFixed(2)}%`);

      const profit = userValue - userAccount.totalDeposited.toNumber();
      const profitPercent =
        userAccount.totalDeposited.toNumber() > 0
          ? (profit / userAccount.totalDeposited.toNumber()) * 100
          : 0;

      console.log(`Profit/Loss: ${profit / LAMPORTS_PER_SOL} SOL (${profitPercent.toFixed(2)}%)`);
      console.log("================================\n");
    } catch (error) {
      console.log("❌ No balance found. Have you deposited yet?");
    }
  }

  /**
   * Get overall fund statistics
   */
  async getFundStats(): Promise<void> {
    try {
      const fundState = await this.program.account.fundState.fetch(this.fundStatePDA);

      console.log("\n📊 Fund Statistics:");
      console.log("================================");
      console.log(`Fund Token Mint: ${fundState.fundTokenMint.toString()}`);
      console.log(`Total Deposits: ${fundState.totalDeposits.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`Total Value: ${fundState.totalValue.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`Total Profit: ${fundState.totalProfit.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`Total Shares: ${fundState.totalShares.toString()}`);
      console.log(`Authority: ${fundState.authority.toString()}`);

      const roi =
        fundState.totalDeposits.toNumber() > 0
          ? ((fundState.totalValue.toNumber() - fundState.totalDeposits.toNumber()) /
              fundState.totalDeposits.toNumber()) *
            100
          : 0;

      console.log(`ROI: ${roi.toFixed(2)}%`);
      console.log("================================\n");
    } catch (error) {
      console.log("❌ Fund not initialized yet");
    }
  }

  /**
   * Get public keys
   */
  getPDAs() {
    return {
      fundState: this.fundStatePDA,
      vault: this.vaultPDA,
      fundTokenMint: this.fundTokenMintPDA,
      fundTokenVault: this.fundTokenVaultPDA,
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Load configuration
  const RPC_URL = process.env.RPC_URL || "http://localhost:8899";
  const PROGRAM_ID = process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";
  const KEYPAIR_PATH = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;

  // Load wallet
  const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));

  // Connect to Solana
  const connection = new Connection(RPC_URL, "confirmed");
  console.log(`📡 Connected to: ${RPC_URL}`);
  console.log(`👤 Wallet: ${wallet.publicKey.toString()}\n`);

  // Create client
  const client = new FundClient(connection, new PublicKey(PROGRAM_ID), wallet);

  // Show PDAs
  const pdas = client.getPDAs();
  console.log("📍 Program Addresses:");
  console.log(`Fund State: ${pdas.fundState.toString()}`);
  console.log(`Vault: ${pdas.vault.toString()}`);
  console.log(`Fund Token Mint: ${pdas.fundTokenMint.toString()}`);
  console.log();

  // Execute command
  try {
    switch (command) {
      case "init":
      case "initialize":
        await client.initialize();
        break;

      case "deposit":
        const depositAmount = parseFloat(args[1]);
        if (!depositAmount || depositAmount <= 0) {
          console.error("❌ Please provide a valid deposit amount");
          console.log("Usage: npm run client deposit <amount_in_sol>");
          process.exit(1);
        }
        await client.deposit(depositAmount);
        break;

      case "withdraw":
        const shares = parseInt(args[1]);
        if (!shares || shares <= 0) {
          console.error("❌ Please provide valid number of shares");
          console.log("Usage: npm run client withdraw <shares>");
          process.exit(1);
        }
        await client.withdraw(shares);
        break;

      case "claim":
        const claimAmount = parseInt(args[1]);
        if (!claimAmount || claimAmount <= 0) {
          console.error("❌ Please provide valid amount of tokens to claim");
          console.log("Usage: npm run client claim <amount>");
          process.exit(1);
        }
        await client.claimFundTokens(claimAmount);
        break;

      case "balance":
        await client.getBalance();
        break;

      case "stats":
        await client.getFundStats();
        break;

      default:
        console.log("📖 Trading Fund Client\n");
        console.log("Available commands:");
        console.log("  init                    - Initialize the fund (one-time)");
        console.log("  deposit <amount>        - Deposit SOL into the fund");
        console.log("  withdraw <shares>       - Withdraw from the fund");
        console.log("  claim <amount>          - Claim fund tokens");
        console.log("  balance                 - Check your balance");
        console.log("  stats                   - View fund statistics");
        console.log("\nExamples:");
        console.log("  npm run client init");
        console.log("  npm run client deposit 1.5");
        console.log("  npm run client balance");
        console.log("  npm run client stats");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default FundClient;
