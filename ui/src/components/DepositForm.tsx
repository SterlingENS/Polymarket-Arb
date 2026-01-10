'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTradingFund } from '@/hooks/useTradingFund';

export default function DepositForm() {
  const { connected } = useWallet();
  const { deposit, loading } = useTradingFund();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!connected) {
      setError('Please connect your wallet first');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const signature = await deposit(amountNum);
      setSuccess(`Deposit successful! Transaction: ${signature.slice(0, 8)}...`);
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to deposit');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Deposit SOL</h2>

      <form onSubmit={handleDeposit} className="space-y-4">
        <div>
          <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (SOL)
          </label>
          <div className="relative">
            <input
              id="depositAmount"
              type="number"
              step="0.0001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={!connected || loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              SOL
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAmount('1')}
            disabled={!connected || loading}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            1 SOL
          </button>
          <button
            type="button"
            onClick={() => setAmount('5')}
            disabled={!connected || loading}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            5 SOL
          </button>
          <button
            type="button"
            onClick={() => setAmount('10')}
            disabled={!connected || loading}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            10 SOL
          </button>
        </div>

        <button
          type="submit"
          disabled={!connected || loading || !amount}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
              <span className="mr-2">💰</span>
              Deposit
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
              Connect your wallet to deposit into the fund
            </p>
          </div>
        )}
      </form>

      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">How it works:</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Deposit SOL and receive proportional shares</li>
          <li>• Trading bot executes automated trades</li>
          <li>• 90% of profits reinvested, 10% minted as fund tokens</li>
          <li>• Withdraw anytime based on your shares</li>
        </ul>
      </div>
    </div>
  );
}
