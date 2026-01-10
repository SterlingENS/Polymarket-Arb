'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useTradingFund } from '@/hooks/useTradingFund';

export default function UserBalance() {
  const { connected } = useWallet();
  const { fundState, userAccount } = useTradingFund();

  if (!connected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔌</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600">
            Connect your wallet to view your balance and interact with the fund
          </p>
        </div>
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Position Yet
          </h3>
          <p className="text-gray-600">
            You haven't deposited into the fund yet. Make your first deposit to get started!
          </p>
        </div>
      </div>
    );
  }

  const userValue = fundState && fundState.totalShares > 0
    ? (userAccount.shares * fundState.totalValue) / fundState.totalShares
    : 0;

  const profit = userValue - userAccount.totalDeposited;
  const profitPercent = userAccount.totalDeposited > 0
    ? (profit / userAccount.totalDeposited) * 100
    : 0;

  const ownership = fundState && fundState.totalShares > 0
    ? (userAccount.shares / fundState.totalShares) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Position</h2>

      <div className="space-y-4">
        {/* Current Value */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Current Value</p>
          <p className="text-4xl font-bold">
            {(userValue / LAMPORTS_PER_SOL).toFixed(4)} SOL
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Deposited</p>
            <p className="text-xl font-semibold text-gray-800">
              {(userAccount.totalDeposited / LAMPORTS_PER_SOL).toFixed(4)} SOL
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Your Shares</p>
            <p className="text-xl font-semibold text-gray-800">
              {userAccount.shares.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Profit/Loss</p>
            <p className={`text-xl font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{(profit / LAMPORTS_PER_SOL).toFixed(4)} SOL
            </p>
            <p className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Fund Ownership</p>
            <p className="text-xl font-semibold text-gray-800">
              {ownership.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Profit Breakdown */}
        {profit > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🎉</span>
              <p className="font-semibold text-green-800">You're in profit!</p>
            </div>
            <p className="text-sm text-green-700">
              Your position has grown by {profitPercent.toFixed(2)}% since you deposited.
              Keep holding to benefit from future profits!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
