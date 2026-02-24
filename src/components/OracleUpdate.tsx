import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  CLEAR_ORACLE_ABI,
  getTokenByAddress,
} from '../config/contracts'
import {
  getGraphQLClient,
  GET_ORACLE_HISTORY,
  ClearOracleHistoryData,
} from '../lib/graphql'
import { useChainConfig } from '../hooks/useChainConfig'

// Oracle prices use 8 decimals (1.00 USD = 100000000)
const ORACLE_DECIMALS = 8

function formatOraclePrice(raw: bigint): string {
  return (Number(raw) / 10 ** ORACLE_DECIMALS).toFixed(8)
}

function TokenOracleRow({
  token,
  oracleAddress,
}: {
  token: { address: `0x${string}`; symbol: string; decimals: number }
  oracleAddress: `0x${string}`
}) {
  const { data: oracleData } = useReadContract({
    address: oracleAddress,
    abi: CLEAR_ORACLE_ABI,
    functionName: 'getPriceAndRedemptionPrice',
    args: [token.address],
  })

  const price = oracleData?.[0]
  const redemptionPrice = oracleData?.[1]

  const isDepegged =
    price !== undefined && Number(price) / 10 ** ORACLE_DECIMALS < 0.9995

  return (
    <tr className="border-t border-clear-border">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {token.symbol.slice(0, 2)}
          </div>
          <span className="font-medium text-white">{token.symbol}</span>
        </div>
      </td>
      <td className={`px-4 py-3 text-right font-mono ${isDepegged ? 'text-red-400' : 'text-white'}`}>
        {price !== undefined ? `$${formatOraclePrice(price)}` : '—'}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sky-400">
        {redemptionPrice !== undefined ? `$${formatOraclePrice(redemptionPrice)}` : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        {price !== undefined ? (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isDepegged
                ? 'bg-red-900/40 text-red-400 border border-red-500/30'
                : 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isDepegged ? 'Depegged' : 'Pegged'}
          </span>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}

const TOKEN_COLORS: Record<string, string> = {
  GHO: '#7c3aed',
  USDC: '#1a56db',
  USDe: '#0d9488',
  USDS: '#d97706',
  USDT: '#059669',
}

interface OracleHistoryResponse {
  clearOracles: ClearOracleHistoryData[]
}

function useOracleHistory(chainId: number) {
  return useQuery({
    queryKey: ['oracleHistory', chainId],
    queryFn: () =>
      getGraphQLClient(chainId).request<OracleHistoryResponse>(GET_ORACLE_HISTORY).then(d => d.clearOracles),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

function formatTimestamp(ts: string): string {
  const date = new Date(Number(ts) * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function OraclePriceHistoryChart() {
  const chainId = useChainId()
  const { data: oracles, isLoading } = useOracleHistory(chainId)
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(new Set())

  if (isLoading) {
    return (
      <div className="bg-clear-card border border-clear-border rounded-xl p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-40 mb-4" />
          <div className="h-56 bg-slate-800 rounded" />
        </div>
      </div>
    )
  }

  if (!oracles || oracles.length === 0) {
    return (
      <div className="bg-clear-card border border-clear-border rounded-xl p-5">
        <h3 className="font-semibold text-white mb-2">Oracle Price History</h3>
        <p className="text-slate-500 text-sm text-center py-8">No oracle history available</p>
      </div>
    )
  }

  // Map oracle asset addresses to token symbols and build chart data
  const tokenLines = oracles
    .map(oracle => {
      const token = getTokenByAddress(oracle.asset, chainId)
      const symbol = token?.symbol ?? oracle.asset.slice(0, 6)
      return { symbol, asset: oracle.asset, history: oracle.priceHistory }
    })
    .filter(t => t.history.length > 0)

  // Build unified timeline: collect all timestamps, merge into one dataset
  const allTimestamps = Array.from(
    new Set(tokenLines.flatMap(t => t.history.map(h => h.timestamp)))
  ).sort((a, b) => Number(a) - Number(b))

  // Build price lookup: symbol -> timestamp -> price
  const priceLookup = new Map<string, Map<string, number>>()
  for (const t of tokenLines) {
    const map = new Map<string, number>()
    for (const h of t.history) {
      map.set(h.timestamp, Number(h.price) / 10 ** ORACLE_DECIMALS)
    }
    priceLookup.set(t.symbol, map)
  }

  const chartData = allTimestamps.map(ts => {
    const point: Record<string, string | number> = { ts: formatTimestamp(ts) }
    for (const t of tokenLines) {
      const price = priceLookup.get(t.symbol)?.get(ts)
      if (price !== undefined) point[t.symbol] = price
    }
    return point
  })

  // Determine y-axis domain with padding
  const allPrices = tokenLines.flatMap(t =>
    t.history.map(h => Number(h.price) / 10 ** ORACLE_DECIMALS)
  )
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const padding = Math.max((maxPrice - minPrice) * 0.1, 0.002)
  const yMin = Math.floor((minPrice - padding) * 1000) / 1000
  const yMax = Math.ceil((maxPrice + padding) * 1000) / 1000

  const toggleToken = (symbol: string) => {
    setHiddenTokens(prev => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  return (
    <div className="bg-clear-card border border-clear-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Oracle Price History</h3>
        <div className="flex flex-wrap gap-2">
          {tokenLines.map(t => (
            <button
              key={t.symbol}
              onClick={() => toggleToken(t.symbol)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                hiddenTokens.has(t.symbol)
                  ? 'bg-slate-800 border-slate-600 text-slate-500'
                  : 'bg-slate-800 border-slate-600 text-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: hiddenTokens.has(t.symbol)
                    ? '#475569'
                    : TOKEN_COLORS[t.symbol] ?? '#6b7280',
                }}
              />
              {t.symbol}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="ts"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `$${v.toFixed(4)}`}
            width={72}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number | undefined, name: string | undefined) => [`$${Number(value ?? 0).toFixed(6)}`, name ?? '']}
          />
          <ReferenceLine
            y={1.0}
            stroke="#334155"
            strokeDasharray="4 4"
            label={{ value: '$1.00', position: 'right', fill: '#94a3b8', fontSize: 10 }}
          />
          <ReferenceLine
            y={0.9995}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: 'depeg', position: 'right', fill: '#ef4444', fontSize: 10 }}
          />
          {tokenLines.map(t => (
            <Line
              key={t.symbol}
              type="monotone"
              dataKey={t.symbol}
              stroke={TOKEN_COLORS[t.symbol] ?? '#6b7280'}
              strokeWidth={1.5}
              dot={false}
              connectNulls
              hide={hiddenTokens.has(t.symbol)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OracleUpdate() {
  const { address: userAddress } = useAccount()
  const { addresses, tokens } = useChainConfig()

  const TOKEN_LIST = Object.values(tokens)
  const [selectedToken, setSelectedToken] = useState(TOKEN_LIST[0])
  const [newPrice, setNewPrice] = useState('')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContractAsync, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Current oracle price
  const { data: currentOracleData, refetch } = useReadContract({
    address: addresses.clearOracle,
    abi: CLEAR_ORACLE_ABI,
    functionName: 'getPriceAndRedemptionPrice',
    args: [selectedToken.address],
  })

  const currentPrice = currentOracleData?.[0]
  const currentRedemptionPrice = currentOracleData?.[1]
  const isCurrentDepegged =
    currentPrice !== undefined && Number(currentPrice) / 10 ** ORACLE_DECIMALS < 0.9995

  const handleSetPrice = async () => {
    if (!userAddress || !newPrice) return
    const priceRaw = BigInt(Math.round(Number(newPrice) * 10 ** ORACLE_DECIMALS))
    const hash = await writeContractAsync({
      address: addresses.clearOracle,
      abi: CLEAR_ORACLE_ABI,
      functionName: 'updateCustomOraclePrice',
      args: [selectedToken.address, priceRaw],
    })
    setTxHash(hash)
    setNewPrice('')
    setTimeout(() => refetch(), 2000)
  }

  const handlePresetPrice = (price: string) => {
    setNewPrice(price)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Oracle Price Update</h2>
        <p className="text-slate-400 text-sm mt-1">
          Update price feed manually — for testing depeg scenarios
        </p>
      </div>

      {/* Price History Chart */}
      <OraclePriceHistoryChart />

      {/* Current Prices Table */}
      <div className="bg-clear-card border border-clear-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-clear-border">
          <h3 className="font-semibold text-white">Current Oracle Prices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Token</th>
                <th className="px-4 py-3 text-right">Oracle Price</th>
                <th className="px-4 py-3 text-right">Redemption Price</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {TOKEN_LIST.map((token) => (
                <TokenOracleRow key={token.address} token={token} oracleAddress={addresses.clearOracle} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Panel */}
      <div className="bg-clear-card border border-clear-border rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="font-semibold text-white">Update Price</h3>
          <span className="text-xs text-slate-400 ml-auto">Requires PROTOCOL_ADMIN role</span>
        </div>

        {/* Token selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Token</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {TOKEN_LIST.map((t) => (
              <button
                key={t.symbol}
                onClick={() => setSelectedToken(t)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                  selectedToken.symbol === t.symbol
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-clear-border text-slate-300 hover:border-slate-500'
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Current value display */}
        {currentPrice !== undefined && (
          <div className="bg-slate-800/60 rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current oracle price</span>
              <span className={`font-mono ${isCurrentDepegged ? 'text-red-400' : 'text-white'}`}>${formatOraclePrice(currentPrice)}</span>
            </div>
            {currentRedemptionPrice !== undefined && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-slate-400">Redemption price</span>
                <span className="text-sky-400 font-mono">${formatOraclePrice(currentRedemptionPrice)}</span>
              </div>
            )}
          </div>
        )}

        {/* Price input */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">
            New Price (USD)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="e.g. 0.97"
              min="0"
              step="0.001"
              className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick presets */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Quick presets:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '$1.00 (pegged)', value: '1.00' },
              { label: '$0.999 (-0.1%)', value: '0.999' },
              { label: '$0.995 (-0.5%)', value: '0.995' },
              { label: '$0.990 (-1%)', value: '0.990' },
              { label: '$0.980 (-2%)', value: '0.980' },
              { label: '$0.950 (-5%)', value: '0.950' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetPrice(preset.value)}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-clear-border hover:border-slate-500 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-400 flex gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            This updates the oracle price used by ClearSwap to determine depeg status. Use for testing
            purposes only on testnet.
          </span>
        </div>

        {/* Submit */}
        {!userAddress ? (
          <div className="text-center text-slate-400 text-sm py-1">Connect wallet to update price</div>
        ) : (
          <button
            onClick={handleSetPrice}
            disabled={!newPrice || isPending || isConfirming}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {isPending || isConfirming
              ? 'Updating...'
              : `Set ${selectedToken.symbol} to $${newPrice || '—'}`}
          </button>
        )}

        {isSuccess && txHash && (
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 text-sm">
            <p className="text-emerald-400 font-medium">Price updated successfully!</p>
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-xs font-mono mt-1 block"
            >
              {txHash.slice(0, 20)}...{txHash.slice(-10)} ↗
            </a>
          </div>
        )}
      </div>

      
    </div>
  )
}
