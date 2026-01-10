'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Solana Trading Fund</h1>
              <p className="text-sm text-purple-100">Automated DeFi Trading</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
}
