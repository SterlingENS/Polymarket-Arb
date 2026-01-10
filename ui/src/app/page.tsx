'use client';

import Header from '@/components/Header';
import FundStats from '@/components/FundStats';
import UserBalance from '@/components/UserBalance';
import DepositForm from '@/components/DepositForm';
import WithdrawForm from '@/components/WithdrawForm';
import TradingActivity from '@/components/TradingActivity';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to the Solana Trading Fund 🚀
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Automated DeFi trading with transparent profit distribution
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-semibold">Deposit SOL</p>
              <p className="text-sm opacity-75">Get proportional shares</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <div className="text-3xl mb-2">🤖</div>
              <p className="font-semibold">Auto Trading</p>
              <p className="text-sm opacity-75">Bot executes trades 24/7</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <div className="text-3xl mb-2">📈</div>
              <p className="font-semibold">Earn Profits</p>
              <p className="text-sm opacity-75">90% reinvested, 10% to token</p>
            </div>
          </div>
        </div>

        {/* Fund Statistics */}
        <div className="mb-8">
          <FundStats />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - User Balance */}
          <div className="lg:col-span-1">
            <UserBalance />
          </div>

          {/* Middle Column - Deposit/Withdraw */}
          <div className="lg:col-span-1 space-y-8">
            <DepositForm />
            <WithdrawForm />
          </div>

          {/* Right Column - Trading Activity */}
          <div className="lg:col-span-1">
            <TradingActivity />
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Secure</h3>
            <p className="text-sm text-gray-600">
              Smart contract audited and tested. Your funds are protected by Solana's security.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Fast</h3>
            <p className="text-sm text-gray-600">
              Instant deposits and withdrawals powered by Solana's high-speed blockchain.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-3">🌐</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Decentralized</h3>
            <p className="text-sm text-gray-600">
              Fully on-chain, non-custodial. You maintain control of your assets.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm py-8">
          <p className="mb-2">
            Built on Solana with ❤️ using Anchor Framework
          </p>
          <p className="text-xs text-gray-500">
            ⚠️ This is a development project. Use at your own risk. DYOR.
          </p>
        </footer>
      </main>
    </div>
  );
}
