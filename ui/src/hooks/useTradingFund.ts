'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { useCallback, useEffect, useState } from 'react';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

interface FundState {
  authority: PublicKey;
  fundTokenMint: PublicKey;
  totalDeposits: number;
  totalShares: number;
  totalValue: number;
  totalProfit: number;
  profitToTokenPercentage: number;
}

interface UserAccount {
  shares: number;
  totalDeposited: number;
}

export function useTradingFund() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [fundState, setFundState] = useState<FundState | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive PDAs
  const [fundStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('fund_state')],
    PROGRAM_ID
  );

  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault')],
    PROGRAM_ID
  );

  const [fundTokenMintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('fund_token')],
    PROGRAM_ID
  );

  const [fundTokenVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('fund_token_vault')],
    PROGRAM_ID
  );

  const getUserAccountPDA = useCallback((userPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), userPubkey.toBuffer()],
      PROGRAM_ID
    )[0];
  }, []);

  // Fetch fund state
  const fetchFundState = useCallback(async () => {
    try {
      const accountInfo = await connection.getAccountInfo(fundStatePDA);
      if (!accountInfo) {
        setFundState(null);
        return;
      }

      // Parse the account data (simplified - in production use IDL)
      const data = accountInfo.data;

      // This is a simplified parser - in production, use the IDL
      const fundState: FundState = {
        authority: new PublicKey(data.slice(8, 40)),
        fundTokenMint: new PublicKey(data.slice(40, 72)),
        totalDeposits: Number(new anchor.BN(data.slice(72, 80), 'le')),
        totalShares: Number(new anchor.BN(data.slice(80, 88), 'le')),
        totalValue: Number(new anchor.BN(data.slice(88, 96), 'le')),
        totalProfit: Number(new anchor.BN(data.slice(96, 104), 'le')),
        profitToTokenPercentage: data[104],
      };

      setFundState(fundState);
    } catch (err) {
      console.error('Error fetching fund state:', err);
      setFundState(null);
    }
  }, [connection, fundStatePDA]);

  // Fetch user account
  const fetchUserAccount = useCallback(async () => {
    if (!publicKey) {
      setUserAccount(null);
      return;
    }

    try {
      const userAccountPDA = getUserAccountPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(userAccountPDA);

      if (!accountInfo) {
        setUserAccount(null);
        return;
      }

      const data = accountInfo.data;
      const userAccount: UserAccount = {
        shares: Number(new anchor.BN(data.slice(8, 16), 'le')),
        totalDeposited: Number(new anchor.BN(data.slice(16, 24), 'le')),
      };

      setUserAccount(userAccount);
    } catch (err) {
      console.error('Error fetching user account:', err);
      setUserAccount(null);
    }
  }, [connection, publicKey, getUserAccountPDA]);

  // Deposit SOL
  const deposit = useCallback(async (amountSOL: number) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);
      const userAccountPDA = getUserAccountPDA(publicKey);

      // Create instruction (simplified - use anchor in production)
      const instruction = new anchor.web3.TransactionInstruction({
        keys: [
          { pubkey: fundStatePDA, isSigner: false, isWritable: true },
          { pubkey: vaultPDA, isSigner: false, isWritable: true },
          { pubkey: userAccountPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([
          1, // Deposit instruction discriminator
          ...new anchor.BN(amountLamports).toArray('le', 8),
        ]),
      });

      const transaction = new anchor.web3.Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      // Refresh data
      await Promise.all([fetchFundState(), fetchUserAccount()]);

      return signature;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fundStatePDA, vaultPDA, getUserAccountPDA, fetchFundState, fetchUserAccount]);

  // Withdraw
  const withdraw = useCallback(async (shares: number) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const userAccountPDA = getUserAccountPDA(publicKey);

      const instruction = new anchor.web3.TransactionInstruction({
        keys: [
          { pubkey: fundStatePDA, isSigner: false, isWritable: true },
          { pubkey: vaultPDA, isSigner: false, isWritable: true },
          { pubkey: userAccountPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([
          2, // Withdraw instruction discriminator
          ...new anchor.BN(shares).toArray('le', 8),
        ]),
      });

      const transaction = new anchor.web3.Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      // Refresh data
      await Promise.all([fetchFundState(), fetchUserAccount()]);

      return signature;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fundStatePDA, vaultPDA, getUserAccountPDA, fetchFundState, fetchUserAccount]);

  // Auto-refresh data
  useEffect(() => {
    fetchFundState();
    fetchUserAccount();

    const interval = setInterval(() => {
      fetchFundState();
      fetchUserAccount();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [fetchFundState, fetchUserAccount]);

  return {
    fundState,
    userAccount,
    loading,
    error,
    deposit,
    withdraw,
    refresh: () => Promise.all([fetchFundState(), fetchUserAccount()]),
  };
}
