import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import {
  ADDRESSES,
  TOKENS,
  CLEAR_ORACLE_ABI,
} from '../config/contracts'

const TOKEN_LIST = Object.values(TOKENS)

// Oracle prices use 8 decimals (1.00 USD = 100000000)
const ORACLE_DECIMALS = 8

function formatOraclePrice(raw: bigint): string {
  return (Number(raw) / 10 ** ORACLE_DECIMALS).toFixed(8)
}

function TokenOracleRow({
  token,
}: {
  token: { address: `0x${string}`; symbol: string; decimals: number }
}) {
  const { data: oracleData } = useReadContract({
    address: ADDRESSES.clearOracle,
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

export function OracleUpdate() {
  const { address: userAddress } = useAccount()

  const [selectedToken, setSelectedToken] = useState(TOKEN_LIST[0])
  const [newPrice, setNewPrice] = useState('')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContractAsync, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Current oracle price
  const { data: currentOracleData, refetch } = useReadContract({
    address: ADDRESSES.clearOracle,
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
      address: ADDRESSES.clearOracle,
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
                <TokenOracleRow key={token.address} token={token} />
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
