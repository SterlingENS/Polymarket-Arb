use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod trading_fund {
    use super::*;

    /// Initialize the trading fund
    pub fn initialize(
        ctx: Context<Initialize>,
        fund_token_decimals: u8,
    ) -> Result<()> {
        let fund_state = &mut ctx.accounts.fund_state;
        fund_state.authority = ctx.accounts.authority.key();
        fund_state.fund_token_mint = ctx.accounts.fund_token_mint.key();
        fund_state.total_deposits = 0;
        fund_state.total_shares = 0;
        fund_state.total_value = 0;
        fund_state.total_profit = 0;
        fund_state.profit_to_token_percentage = 10; // 10% of profits go to fund token
        fund_state.bump = ctx.bumps.fund_state;
        fund_state.vault_bump = ctx.bumps.vault;

        msg!("Trading fund initialized!");
        msg!("Fund token mint: {}", fund_state.fund_token_mint);

        Ok(())
    }

    /// Deposit SOL into the fund
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, FundError::InvalidAmount);

        let fund_state = &mut ctx.accounts.fund_state;
        let user_account = &mut ctx.accounts.user_account;

        // Transfer SOL from user to vault
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        // Calculate shares for the user
        let shares = if fund_state.total_shares == 0 {
            amount // First depositor gets 1:1 shares
        } else {
            // shares = (amount * total_shares) / total_value
            (amount as u128)
                .checked_mul(fund_state.total_shares as u128)
                .unwrap()
                .checked_div(fund_state.total_value as u128)
                .unwrap() as u64
        };

        // Update user account
        user_account.shares = user_account.shares.checked_add(shares).unwrap();
        user_account.total_deposited = user_account.total_deposited.checked_add(amount).unwrap();

        // Update fund state
        fund_state.total_deposits = fund_state.total_deposits.checked_add(amount).unwrap();
        fund_state.total_shares = fund_state.total_shares.checked_add(shares).unwrap();
        fund_state.total_value = fund_state.total_value.checked_add(amount).unwrap();

        msg!("Deposited {} lamports, received {} shares", amount, shares);

        Ok(())
    }

    /// Withdraw funds based on shares
    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        require!(shares > 0, FundError::InvalidAmount);

        let fund_state = &mut ctx.accounts.fund_state;
        let user_account = &mut ctx.accounts.user_account;

        require!(user_account.shares >= shares, FundError::InsufficientShares);
        require!(fund_state.total_shares > 0, FundError::NoShares);

        // Calculate withdrawal amount based on current total value
        let withdrawal_amount = (shares as u128)
            .checked_mul(fund_state.total_value as u128)
            .unwrap()
            .checked_div(fund_state.total_shares as u128)
            .unwrap() as u64;

        // Transfer SOL from vault to user
        let vault_seeds = &[
            b"vault",
            &[fund_state.vault_bump],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= withdrawal_amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += withdrawal_amount;

        // Update user account
        user_account.shares = user_account.shares.checked_sub(shares).unwrap();

        // Update fund state
        fund_state.total_shares = fund_state.total_shares.checked_sub(shares).unwrap();
        fund_state.total_value = fund_state.total_value.checked_sub(withdrawal_amount).unwrap();

        msg!("Withdrawn {} lamports for {} shares", withdrawal_amount, shares);

        Ok(())
    }

    /// Execute a trade (simplified - in production would integrate with DEX)
    pub fn execute_trade(
        ctx: Context<ExecuteTrade>,
        amount: u64,
        _target_token: Pubkey, // Token to trade for
    ) -> Result<()> {
        require!(amount > 0, FundError::InvalidAmount);

        let fund_state = &ctx.accounts.fund_state;

        // Verify caller is authority
        require!(
            ctx.accounts.authority.key() == fund_state.authority,
            FundError::Unauthorized
        );

        // In a real implementation, this would:
        // 1. Swap SOL for target_token using Jupiter/Raydium
        // 2. Track the position
        // 3. Later swap back to SOL
        // For now, we just emit an event

        msg!("Trade executed: {} lamports for token {}", amount, _target_token);

        Ok(())
    }

    /// Record profit from trading and distribute accordingly
    pub fn record_profit(
        ctx: Context<RecordProfit>,
        profit_amount: u64,
    ) -> Result<()> {
        require!(profit_amount > 0, FundError::InvalidAmount);

        let fund_state = &mut ctx.accounts.fund_state;

        // Verify caller is authority
        require!(
            ctx.accounts.authority.key() == fund_state.authority,
            FundError::Unauthorized
        );

        // Calculate profit distribution
        let to_fund_token = profit_amount
            .checked_mul(fund_state.profit_to_token_percentage as u64)
            .unwrap()
            .checked_div(100)
            .unwrap();

        let to_reinvest = profit_amount.checked_sub(to_fund_token).unwrap();

        // Mint fund tokens as reward (10% of profit)
        let fund_state_seeds = &[
            b"fund_state",
            &[fund_state.bump],
        ];
        let signer_seeds = &[&fund_state_seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.fund_token_mint.to_account_info(),
            to: ctx.accounts.fund_token_vault.to_account_info(),
            authority: ctx.accounts.fund_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        // Mint tokens proportional to profit (simplified: 1 token per lamport)
        token::mint_to(cpi_ctx, to_fund_token)?;

        // Update fund state with reinvested amount
        fund_state.total_value = fund_state.total_value.checked_add(to_reinvest).unwrap();
        fund_state.total_profit = fund_state.total_profit.checked_add(profit_amount).unwrap();

        msg!("Profit recorded: {} total, {} to fund token, {} reinvested",
             profit_amount, to_fund_token, to_reinvest);

        Ok(())
    }

    /// Claim fund tokens earned from profits
    pub fn claim_fund_tokens(ctx: Context<ClaimFundTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, FundError::InvalidAmount);

        let fund_state = &ctx.accounts.fund_state;
        let user_account = &ctx.accounts.user_account;

        // Calculate user's share of fund tokens based on their shares
        let user_share_percentage = if fund_state.total_shares > 0 {
            (user_account.shares as u128)
                .checked_mul(10000)
                .unwrap()
                .checked_div(fund_state.total_shares as u128)
                .unwrap() as u64
        } else {
            0
        };

        // Verify user has enough share to claim
        require!(user_share_percentage > 0, FundError::InsufficientShares);

        // Transfer fund tokens from vault to user
        let fund_state_seeds = &[
            b"fund_state",
            &[fund_state.bump],
        ];
        let signer_seeds = &[&fund_state_seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.fund_token_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.fund_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer(cpi_ctx, amount)?;

        msg!("Claimed {} fund tokens", amount);

        Ok(())
    }
}

// Account structures

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + FundState::INIT_SPACE,
        seeds = [b"fund_state"],
        bump
    )]
    pub fund_state: Account<'info, FundState>,

    #[account(
        init,
        payer = authority,
        seeds = [b"vault"],
        bump,
        space = 0
    )]
    /// CHECK: Vault PDA for holding SOL
    pub vault: AccountInfo<'info>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = fund_state,
        seeds = [b"fund_token"],
        bump
    )]
    pub fund_token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = fund_token_mint,
        token::authority = fund_state,
        seeds = [b"fund_token_vault"],
        bump
    )]
    pub fund_token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"fund_state"],
        bump = fund_state.bump
    )]
    pub fund_state: Account<'info, FundState>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = fund_state.vault_bump
    )]
    /// CHECK: Vault PDA
    pub vault: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"fund_state"],
        bump = fund_state.bump
    )]
    pub fund_state: Account<'info, FundState>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = fund_state.vault_bump
    )]
    /// CHECK: Vault PDA
    pub vault: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteTrade<'info> {
    #[account(
        seeds = [b"fund_state"],
        bump = fund_state.bump
    )]
    pub fund_state: Account<'info, FundState>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordProfit<'info> {
    #[account(
        mut,
        seeds = [b"fund_state"],
        bump = fund_state.bump
    )]
    pub fund_state: Account<'info, FundState>,

    #[account(
        mut,
        seeds = [b"fund_token"],
        bump,
        mint::authority = fund_state,
    )]
    pub fund_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"fund_token_vault"],
        bump,
    )]
    pub fund_token_vault: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimFundTokens<'info> {
    #[account(
        seeds = [b"fund_state"],
        bump = fund_state.bump
    )]
    pub fund_state: Account<'info, FundState>,

    #[account(
        mut,
        seeds = [b"fund_token_vault"],
        bump,
    )]
    pub fund_token_vault: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// State structures

#[account]
#[derive(InitSpace)]
pub struct FundState {
    pub authority: Pubkey,
    pub fund_token_mint: Pubkey,
    pub total_deposits: u64,
    pub total_shares: u64,
    pub total_value: u64,
    pub total_profit: u64,
    pub profit_to_token_percentage: u8,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub shares: u64,
    pub total_deposited: u64,
}

// Errors

#[error_code]
pub enum FundError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient shares")]
    InsufficientShares,
    #[msg("No shares in fund")]
    NoShares,
    #[msg("Unauthorized")]
    Unauthorized,
}
