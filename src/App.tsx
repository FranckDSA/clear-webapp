import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { VaultDetails } from './components/VaultDetails'
import { Swap } from './components/Swap'
import { OracleUpdate } from './components/OracleUpdate'
import { Stats } from './components/Stats'
import { CurvePools } from './components/CurvePools'
import { Mint } from './components/Mint'
import { RebalanceAgent } from './components/RebalanceAgent'

type Tab = 'home' | 'vault' | 'swap' | 'pools' | 'oracle' | 'mint' | 'agent'

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'home',
      label: 'Overview',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'vault',
      label: 'Vault',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M9 10v10M15 10v10M5 6l7-3 7 3" />
        </svg>
      ),
    },
    {
      id: 'swap',
      label: 'Swap',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
    },
    {
      id: 'pools',
      label: 'Pools',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h7" />
          <circle cx="18" cy="17" r="3" strokeWidth={1.5} />
        </svg>
      ),
    },
    {
      id: 'oracle',
      label: 'Oracle',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'mint',
      label: 'Faucet',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: 'agent',
      label: 'Agent',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-clear-dark">
      {/* Header */}
      <header className="border-b border-clear-border bg-clear-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Clear Protocol</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Arbitrum Sepolia</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-clear-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Wallet */}
          <div className="flex-shrink-0">
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden flex border-t border-clear-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-t-2 border-blue-500'
                  : 'text-slate-400 border-t-2 border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'home' && <Stats />}
        {activeTab === 'vault' && <VaultDetails />}
        {activeTab === 'swap' && <Swap />}
        {activeTab === 'pools' && <CurvePools />}
        {activeTab === 'oracle' && <OracleUpdate />}
        {activeTab === 'mint' && <Mint />}
        {activeTab === 'agent' && <RebalanceAgent />}
      </main>

      {/* Footer */}
      <footer className="border-t border-clear-border mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Clear Protocol — Testnet Interface</span>
          <div className="flex items-center gap-4">
            <a
              href="https://sepolia.arbiscan.io/address/0x745dbbA17916112DB6c5289863073705A3644db1"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              ClearSwap ↗
            </a>
            <a
              href="https://sepolia.arbiscan.io/address/0x81Ff66eEf8516C44187B47C6a497b248eA74213D"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              Oracle ↗
            </a>
            <a
              href="https://sepolia.arbiscan.io/address/0x02912591442Beb7Fd824Df4c90006093371898EF"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              Vault ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
