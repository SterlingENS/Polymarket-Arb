import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TradingFund } from "../target/types/trading_fund";
import { expect } from "chai";

describe("trading-fund", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TradingFund as Program<TradingFund>;

  let fundStatePDA: PublicKey;
  let vaultPDA: PublicKey;
  let fundTokenMintPDA: PublicKey;
  let fundTokenVaultPDA: PublicKey;
  let userAccountPDA: PublicKey;

  before(async () => {
    // Derive PDAs
    [fundStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_state")],
      program.programId
    );

    [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    [fundTokenMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_token")],
      program.programId
    );

    [fundTokenVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("fund_token_vault")],
      program.programId
    );

    [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes the fund", async () => {
    const tx = await program.methods
      .initialize(9)
      .accounts({
        fundState: fundStatePDA,
        vault: vaultPDA,
        fundTokenMint: fundTokenMintPDA,
        fundTokenVault: fundTokenVaultPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Fetch and verify fund state
    const fundState = await program.account.fundState.fetch(fundStatePDA);
    expect(fundState.authority.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
    expect(fundState.totalDeposits.toNumber()).to.equal(0);
    expect(fundState.totalShares.toNumber()).to.equal(0);
    expect(fundState.profitToTokenPercentage).to.equal(10);
  });

  it("Deposits SOL into the fund", async () => {
    const depositAmount = 1 * LAMPORTS_PER_SOL;

    const tx = await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        fundState: fundStatePDA,
        vault: vaultPDA,
        userAccount: userAccountPDA,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit transaction signature:", tx);

    // Verify fund state
    const fundState = await program.account.fundState.fetch(fundStatePDA);
    expect(fundState.totalDeposits.toNumber()).to.equal(depositAmount);
    expect(fundState.totalShares.toNumber()).to.be.greaterThan(0);

    // Verify user account
    const userAccount = await program.account.userAccount.fetch(userAccountPDA);
    expect(userAccount.shares.toNumber()).to.be.greaterThan(0);
    expect(userAccount.totalDeposited.toNumber()).to.equal(depositAmount);
  });

  it("Records profit and distributes correctly", async () => {
    const profitAmount = 0.5 * LAMPORTS_PER_SOL;

    const fundStateBefore = await program.account.fundState.fetch(fundStatePDA);
    const totalValueBefore = fundStateBefore.totalValue.toNumber();

    const tx = await program.methods
      .recordProfit(new anchor.BN(profitAmount))
      .accounts({
        fundState: fundStatePDA,
        fundTokenMint: fundTokenMintPDA,
        fundTokenVault: fundTokenVaultPDA,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Record profit transaction signature:", tx);

    // Verify fund state after profit
    const fundStateAfter = await program.account.fundState.fetch(fundStatePDA);
    const totalValueAfter = fundStateAfter.totalValue.toNumber();

    // 90% should be reinvested
    const expectedReinvestment = Math.floor(profitAmount * 0.9);
    const actualIncrease = totalValueAfter - totalValueBefore;

    expect(actualIncrease).to.equal(expectedReinvestment);
    expect(fundStateAfter.totalProfit.toNumber()).to.equal(profitAmount);
  });

  it("Withdraws funds correctly", async () => {
    const userAccountBefore = await program.account.userAccount.fetch(userAccountPDA);
    const sharesToWithdraw = Math.floor(userAccountBefore.shares.toNumber() / 2);

    const tx = await program.methods
      .withdraw(new anchor.BN(sharesToWithdraw))
      .accounts({
        fundState: fundStatePDA,
        vault: vaultPDA,
        userAccount: userAccountPDA,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Withdraw transaction signature:", tx);

    // Verify user account after withdrawal
    const userAccountAfter = await program.account.userAccount.fetch(userAccountPDA);
    expect(userAccountAfter.shares.toNumber()).to.be.lessThan(
      userAccountBefore.shares.toNumber()
    );

    // Verify fund state
    const fundState = await program.account.fundState.fetch(fundStatePDA);
    expect(fundState.totalShares.toNumber()).to.be.greaterThan(0);
  });

  it("Executes a trade", async () => {
    const tradeAmount = 0.1 * LAMPORTS_PER_SOL;
    const mockTokenMint = PublicKey.unique();

    const tx = await program.methods
      .executeTrade(new anchor.BN(tradeAmount), mockTokenMint)
      .accounts({
        fundState: fundStatePDA,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Execute trade transaction signature:", tx);
  });
});
