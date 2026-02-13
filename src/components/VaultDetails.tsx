import { useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import {
  ADDRESSES,
  CLEAR_VAULT_ABI,
  CLEAR_ORACLE_ABI,
  TOKEN_BY_ADDRESS,
} from '../config/contracts'

interface TokenDetails {
    addr: `0x${string}`;
    iou: `0x${string}`;
    iouCurveMetaPool: `0x${string}`;
    adapter: `0x${string}`;
    maxExposureBps: bigint;
    desiredExposureBps: bigint;
    emitedIou: bigint;
    balance: bigint;
    exposure: bigint;
    decimals: number;
}

function bpsToPercent(bps: bigint | undefined): string {
  if (bps === undefined) return '—'
  return `${(Number(bps) / 100).toFixed(2)}%`
}

function formatPrice(price: bigint | undefined): string {
  if (price === undefined) return '—'
  // Oracle prices use 8 decimals
  return `$${(Number(price) / 1e8).toFixed(6)}`
}

function TokenRow({ vault, token }: { vault: `0x${string}`, token: TokenDetails }) {
  const tokenInfo = TOKEN_BY_ADDRESS[token.addr.toLowerCase()]
  const symbol = tokenInfo?.symbol ?? token.addr.slice(0, 8) + '...'
  const decimals = token.decimals ?? 18

  const { data: assets } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'tokenAssets',
    args: [token.addr as `0x${string}`],
  })

  const { data: oracleData } = useReadContract({
    address: ADDRESSES.clearOracle,
    abi: CLEAR_ORACLE_ABI,
    functionName: 'getPriceAndRedemptionPrice',
    args: [token.addr as `0x${string}`],
  })

  return (
    <tr className="border-t border-clear-border hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {symbol.slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-white">{symbol}</p>
            <p className="text-xs text-slate-400 font-mono">{token.addr.slice(0, 8)}...{token.addr.slice(-6)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-white font-mono">
          {assets !== undefined
            ? Number(formatUnits(assets, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-emerald-400 font-mono">
          {oracleData !== undefined ? formatPrice(oracleData[0]) : '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sky-400 font-mono">
          {oracleData !== undefined ? formatPrice(oracleData[1]) : '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current:</span>
            <span className="text-white font-mono">{bpsToPercent(token.exposure)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target:</span>
            <span className="text-blue-400 font-mono">{bpsToPercent(token.desiredExposureBps)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Max:</span>
            <span className="text-orange-400 font-mono">{bpsToPercent(token.maxExposureBps)}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {token.iou && token.iou !== '0x0000000000000000000000000000000000000000' ? (
          <span className="text-xs font-mono text-purple-400">
            {token.iou.slice(0, 8)}...{token.iou.slice(-6)}
          </span>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        )}
      </td>
    </tr>
  )
}

export function VaultDetails() {
  const [vaultAddress, setVaultAddress] = useState<`0x${string}`>(ADDRESSES.defaultVault)
  const [inputAddress, setInputAddress] = useState<string>(ADDRESSES.defaultVault)

  const { data: vaultDetails, isLoading, error } = useReadContract({
    address: vaultAddress,
    abi: CLEAR_VAULT_ABI,
    functionName: 'details',
  })

  const { data: totalAssets } = useReadContract({
    address: vaultAddress,
    abi: CLEAR_VAULT_ABI,
    functionName: 'totalAssets',
  })

  const { data: vaultsLength } = useReadContract({
    address: ADDRESSES.clearFactory,
    abi: [
      {
        inputs: [],
        name: 'vaultsLength',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'vaultsLength',
  })

  const tokens = vaultDetails?.[5]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Vault Details</h2>
          <p className="text-slate-400 text-sm mt-1">
            {vaultsLength !== undefined ? `${vaultsLength} vault(s) deployed` : ''}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Vault address"
            className="flex-1 sm:w-80 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setVaultAddress(inputAddress.trim() as `0x${string}`)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Load
          </button>
        </div>
      </div>

      {/* Vault Summary */}
      {isLoading && (
        <div className="bg-clear-card border border-clear-border rounded-xl p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading vault data...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Error loading vault: {error.message}
        </div>
      )}

      {vaultDetails && !isLoading && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-clear-card border border-clear-border rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Assets (USD)</p>
              <p className="text-2xl font-bold text-white">
                {totalAssets !== undefined
                  ? `$${Number(formatUnits(totalAssets, 18)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </p>
            </div>
            <div className="bg-clear-card border border-clear-border rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Vault Address</p>
              <p className="text-sm font-mono text-blue-400 break-all">{vaultAddress}</p>
            </div>
            <div className="bg-clear-card border border-clear-border rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Supported Tokens</p>
              <p className="text-2xl font-bold text-white">{vaultDetails[5].length}</p>
            </div>
          </div>

          {/* Token Table */}
          <div className="bg-clear-card border border-clear-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-clear-border">
              <h3 className="font-semibold text-white">Token Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Token</th>
                    <th className="px-4 py-3 text-right">Assets</th>
                    <th className="px-4 py-3 text-right">Oracle Price</th>
                    <th className="px-4 py-3 text-right">Redemption Price</th>
                    <th className="px-4 py-3 text-right">Exposure</th>
                    <th className="px-4 py-3 text-right">IOU Token</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens?.map((token) => (
                    <TokenRow
                      key={token.addr}
                      token={token}
                      vault={vaultAddress}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
