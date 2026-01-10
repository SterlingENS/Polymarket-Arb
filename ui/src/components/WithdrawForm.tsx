'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useTradingFund } from '@/hooks/useTradingFund';

export default function WithdrawForm() {
  const { connected } = useWallet();
  const { fundState, userAccount, withdraw, loading } = useTradingFund();
  const [percentage, setPercentage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!connected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!userAccount) {
      setError('You have no shares to withdraw');
      return;
    }

    const percentNum = parseFloat(percentage);
    if (isNaN(percentNum) || percentNum <= 0 || percentNum > 100) {
      setError('Please enter a valid percentage (1-100)');
      return;
    }

    const sharesToWithdraw = Math.floor((userAccount.shares * percentNum) / 100);
    if (sharesToWithdraw === 0) {
      setError('Amount too small to withdraw');
      return;
    }

    try {
      const signature = await withdraw(sharesToWithdraw);
      setSuccess(`Withdrawal successful! Transaction: ${signature.slice(0, 8)}...`);
      setPercentage('');
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw');
    }
  };

  const calculateWithdrawal = () => {
    if (!userAccount || !fundState || !percentage) return null;

    const percentNum = parseFloat(percentage);
    if (isNaN(percentNum) || percentNum <= 0 || percentNum > 100) return null;

    const sharesToWithdraw = Math.floor((userAccount.shares * percentNum) / 100);
    const withdrawalAmount = fundState.totalShares > 0
      ? (sharesToWithdraw * fundState.totalValue) / fundState.totalShares
      : 0;

    return {
      shares: sharesToWithdraw,
      amount: withdrawalAmount / LAMPORTS_PER_SOL,
    };
  };

  const withdrawal = calculateWithdrawal();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Withdraw</h2>

      <form onSubmit={handleWithdraw} className="space-y-4">
        <div>
          <label htmlFor="withdrawPercentage" className="block text-sm font-medium text-gray-700 mb-2">
            Percentage to Withdraw
          </label>
          <div className="relative">
            <input
              id="withdrawPercentage"
              type="number"
              step="1"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="0"
              disabled={!connected || loading || !userAccount}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              %
            </div>
          </div>
        </div>

        {/* Quick Percentage Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPercentage('25')}
            disabled={!connected || loading || !userAccount}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setPercentage('50')}
            disabled={!connected || loading || !userAccount}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => setPercentage('75')}
            disabled={!connected || loading || !userAccount}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            75%
          </button>
          <button
            type="button"
            onClick={() => setPercentage('100')}
            disabled={!connected || loading || !userAccount}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            100%
          </button>
        </div>

        {/* Withdrawal Preview */}
        {withdrawal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2 font-medium">You will receive:</p>
            <p className="text-2xl font-bold text-blue-900">
              ~{withdrawal.amount.toFixed(4)} SOL
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Burning {withdrawal.shares.toLocaleString()} shares
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!connected || loading || !userAccount || !percentage}
          className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <span className="mr-2">📤</span>
              Withdraw
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {!connected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Connect your wallet to withdraw from the fund
            </p>
          </div>
        )}

        {connected && !userAccount && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              You have no shares to withdraw. Make a deposit first!
            </p>
          </div>
        )}
      </form>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Important:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Withdrawal amount is based on current fund value</li>
          <li>• Your shares are burned upon withdrawal</li>
          <li>• You receive SOL proportional to your ownership</li>
        </ul>
      </div>
    </div>
  );
}
