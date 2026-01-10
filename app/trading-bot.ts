import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TradingFund } from "../target/types/trading_fund";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

interface TradeConfig {
  minTradeAmount: number; // in SOL
  maxTradeAmount: number; // in SOL
  tradeInterval: number; // in milliseconds
  profitMargin: number; // percentage (e.g., 5 = 5%)
}

class TradingBot {
  private program: Program<TradingFund>;
  private provider: anchor.AnchorProvider;
  private authority: Keypair;
  private fundStatePDA: PublicKey;
  private vaultPDA: PublicKey;
  private config: TradeConfig;

  // Mock token list for random trading
  private readonly MOCK_TOKENS = [
    { name: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    { name: "SAMO", mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
    { name: "COPE", mint: "8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh" },
    { name: "FIDA", mint: "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp" },
    { name: "NINJA", mint: "FgX1WD9WzMU3yLwXaFSarPfkgzjLb2DZCqmkx9ExpuvJ" },
  ];

  constructor(
    connection: Connection,
    programId: PublicKey,
    authorityKeypair: Keypair,
    config: TradeConfig
  ) {
    const wallet = new anchor.Wallet(authorityKeypair);
    this.provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(this.provider);

    this.program = new Program(
      require("../target/idl/trading_fund.json"),
      programId,
      this.provider
    ) as Program<TradingFund>;

    this.authority = authorityKeypair;
    this.config = config;

    // Derive PDAs
    [this.fundStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_state")],
      this.program.programId
    );

    [this.vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      this.program.programId
    );
  }

  /**
   * Start the trading bot
   */
  async start(): Promise<void> {
    console.log("🤖 Trading Bot Starting...");
    console.log(`Authority: ${this.authority.publicKey.toString()}`);
    console.log(`Fund State: ${this.fundStatePDA.toString()}`);
    console.log(`Trade Interval: ${this.config.tradeInterval / 1000}s`);
    console.log("================================\n");

    // Main trading loop
    setInterval(async () => {
      try {
        await this.executeTradingCycle();
      } catch (error) {
        console.error("❌ Error in trading cycle:", error);
      }
    }, this.config.tradeInterval);

    // Keep the bot running
    console.log("✅ Bot is now running. Press Ctrl+C to stop.\n");
  }

  /**
   * Execute one complete trading cycle
   */
  private async executeTradingCycle(): Promise<void> {
    console.log(`\n[${new Date().toISOString()}] Starting trading cycle...`);

    try {
      // Get fund state
      const fundState = await this.program.account.fundState.fetch(this.fundStatePDA);
      console.log(`💰 Fund Total Value: ${fundState.totalValue / LAMPORTS_PER_SOL} SOL`);
      console.log(`📊 Total Shares: ${fundState.totalShares.toString()}`);

      // Skip if fund has no value
      if (fundState.totalValue.toNumber() === 0) {
        console.log("⏭️  No funds to trade, skipping cycle");
        return;
      }

      // 1. Select random token to trade
      const randomToken = this.selectRandomToken();
      console.log(`🎯 Selected token: ${randomToken.name} (${randomToken.mint})`);

      // 2. Determine trade amount (random between min and max)
      const tradeAmountSOL = this.getRandomTradeAmount();
      const tradeAmountLamports = Math.floor(tradeAmountSOL * LAMPORTS_PER_SOL);

      // Make sure we don't trade more than available
      const maxTradeAmount = Math.min(
        tradeAmountLamports,
        fundState.totalValue.toNumber() * 0.2 // Max 20% of fund per trade
      );

      console.log(`💵 Trade amount: ${maxTradeAmount / LAMPORTS_PER_SOL} SOL`);

      // 3. Execute the trade (in production, this would call Jupiter/Raydium)
      await this.executeTrade(new PublicKey(randomToken.mint), maxTradeAmount);

      // 4. Simulate trading profit/loss
      const profitResult = await this.simulateTradeProfit(maxTradeAmount);

      if (profitResult.profit > 0) {
        console.log(`✅ Trade profitable! Profit: ${profitResult.profit / LAMPORTS_PER_SOL} SOL`);

        // Record profit on-chain
        await this.recordProfit(profitResult.profit);
      } else {
        console.log(`📉 Trade resulted in loss: ${Math.abs(profitResult.profit) / LAMPORTS_PER_SOL} SOL`);
      }

      console.log("✨ Trading cycle completed");

    } catch (error) {
      console.error("Error in trading cycle:", error);
      throw error;
    }
  }

  /**
   * Execute a trade through the smart contract
   */
  private async executeTrade(targetToken: PublicKey, amount: number): Promise<void> {
    try {
      const tx = await this.program.methods
        .executeTrade(new anchor.BN(amount), targetToken)
        .accounts({
          fundState: this.fundStatePDA,
          authority: this.authority.publicKey,
        })
        .signers([this.authority])
        .rpc();

      console.log(`📝 Trade executed, tx: ${tx}`);
    } catch (error) {
      console.error("Failed to execute trade:", error);
      throw error;
    }
  }

  /**
   * Record profit on-chain and trigger distribution
   */
  private async recordProfit(profitAmount: number): Promise<void> {
    try {
      const [fundTokenMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("fund_token")],
        this.program.programId
      );

      const [fundTokenVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("fund_token_vault")],
        this.program.programId
      );

      const tx = await this.program.methods
        .recordProfit(new anchor.BN(profitAmount))
        .accounts({
          fundState: this.fundStatePDA,
          fundTokenMint,
          fundTokenVault,
          authority: this.authority.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .signers([this.authority])
        .rpc();

      const tenPercent = profitAmount * 0.1;
      const ninetyPercent = profitAmount * 0.9;

      console.log(`💎 10% (${tenPercent / LAMPORTS_PER_SOL} SOL) → Fund Token`);
      console.log(`♻️  90% (${ninetyPercent / LAMPORTS_PER_SOL} SOL) → Reinvested`);
      console.log(`📝 Profit recorded, tx: ${tx}`);
    } catch (error) {
      console.error("Failed to record profit:", error);
      throw error;
    }
  }

  /**
   * Simulate trade profit (in production, this would be real DEX trades)
   */
  private async simulateTradeProfit(tradeAmount: number): Promise<{ profit: number }> {
    // Simulate a random profit/loss between -10% and +20%
    const randomOutcome = (Math.random() * 30) - 10; // -10 to +20
    const profit = Math.floor((tradeAmount * randomOutcome) / 100);

    // Simulate trade delay
    await this.sleep(1000);

    return { profit };
  }

  /**
   * Select a random token from the list
   */
  private selectRandomToken(): { name: string; mint: string } {
    const index = Math.floor(Math.random() * this.MOCK_TOKENS.length);
    return this.MOCK_TOKENS[index];
  }

  /**
   * Get random trade amount within configured range
   */
  private getRandomTradeAmount(): number {
    const range = this.config.maxTradeAmount - this.config.minTradeAmount;
    return this.config.minTradeAmount + Math.random() * range;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get fund statistics
   */
  async getFundStats(): Promise<void> {
    const fundState = await this.program.account.fundState.fetch(this.fundStatePDA);

    console.log("\n📊 Fund Statistics:");
    console.log("================================");
    console.log(`Total Deposits: ${fundState.totalDeposits / LAMPORTS_PER_SOL} SOL`);
    console.log(`Total Value: ${fundState.totalValue / LAMPORTS_PER_SOL} SOL`);
    console.log(`Total Profit: ${fundState.totalProfit / LAMPORTS_PER_SOL} SOL`);
    console.log(`Total Shares: ${fundState.totalShares.toString()}`);
    console.log(`Fund Token Mint: ${fundState.fundTokenMint.toString()}`);
    console.log("================================\n");
  }
}

// Main execution
async function main() {
  // Load configuration
  const RPC_URL = process.env.RPC_URL || "http://localhost:8899";
  const PROGRAM_ID = process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";
  const KEYPAIR_PATH = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;

  // Trading configuration
  const config: TradeConfig = {
    minTradeAmount: parseFloat(process.env.MIN_TRADE_AMOUNT || "0.1"),
    maxTradeAmount: parseFloat(process.env.MAX_TRADE_AMOUNT || "1.0"),
    tradeInterval: parseInt(process.env.TRADE_INTERVAL || "30000"), // 30 seconds default
    profitMargin: parseFloat(process.env.PROFIT_MARGIN || "5"),
  };

  console.log("🚀 Initializing Trading Bot...\n");

  // Load authority keypair
  const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8"));
  const authority = Keypair.fromSecretKey(new Uint8Array(keypairData));

  // Connect to Solana
  const connection = new Connection(RPC_URL, "confirmed");
  console.log(`📡 Connected to: ${RPC_URL}`);

  // Create bot instance
  const bot = new TradingBot(
    connection,
    new PublicKey(PROGRAM_ID),
    authority,
    config
  );

  // Show initial stats
  await bot.getFundStats();

  // Start trading
  await bot.start();
}

// Run the bot
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { TradingBot };
