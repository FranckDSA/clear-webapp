import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import {
  getGraphQLClient,
  GET_CURVE_POOLS,
  type CurvePoolData,
  type CurvePoolCoinData,
} from '../lib/graphql'
import { useExplorer } from '../hooks/useExplorer'
import {
  ERC20_ABI,
  CURVE_POOL_ABI,
  CURVE_POOL_2COIN_ABI,
  CURVE_POOL_5COIN_ABI,
} from '../config/contracts'

type ActionTab = 'swap' | 'deposit' | 'withdraw'

function formatAmount(value: string, decimals: number, displayDecimals = 4): string {
  try {
    const n = BigInt(value)
    const formatted = formatUnits(n, decimals)
    const num = parseFloat(formatted)
    if (num === 0) return '0'
    if (num < 0.0001) return '<0.0001'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals,
    })
  } catch {
    return '0'
  }
}

function formatFee(fee: string): string {
  // Fee is in 1e10 basis (1000000 = 0.01%)
  const f = Number(fee) / 1e10
  return `${(f * 100).toFixed(2)}%`
}

function formatVirtualPrice(vp: string): string {
  const n = Number(vp) / 1e18
  return n.toFixed(6)
}

function calcTVL(coins: CurvePoolCoinData[]): number {
  return coins.reduce((sum, coin) => {
    const balance = Number(coin.balance) / 10 ** coin.decimals
    return sum + balance // approximate 1:1 for stablecoins
  }, 0)
}

// ─── Pool Card ───────────────────────────────────────────────────────────────

function PoolCard({
  pool,
  selected,
  onClick,
}: {
  pool: CurvePoolData
  selected: boolean
  onClick: () => void
}) {
  const tvl = calcTVL(pool.coins)
  const isBase = pool.poolType === 'base'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-clear-border bg-clear-card hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{pool.symbol}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                isBase
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              {isBase ? 'Base' : 'Meta'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{pool.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-white">
            {tvl >= 1e6
              ? `$${(tvl / 1e6).toFixed(2)}M`
              : tvl >= 1e3
              ? `$${(tvl / 1e3).toFixed(1)}K`
              : `$${tvl.toFixed(0)}`}
          </p>
          <p className="text-xs text-slate-400">TVL</p>
        </div>
      </div>
      <div className="mt-3 flex gap-1 overflow-hidden rounded-full h-1.5">
        {pool.coins.map((coin, i) => {
          const total = pool.coins.reduce((s, c) => s + Number(c.balance) / 10 ** c.decimals, 0)
          const pct = total > 0 ? (Number(coin.balance) / 10 ** coin.decimals) / total : 1 / pool.coins.length
          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500']
          return (
            <div
              key={i}
              className={`${colors[i % colors.length]} h-full`}
              style={{ width: `${(pct * 100).toFixed(1)}%` }}
            />
          )
        })}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {pool.coins.map((coin, i) => {
          const colors = ['text-blue-400', 'text-purple-400', 'text-teal-400', 'text-orange-400', 'text-pink-400']
          return (
            <span key={i} className={`text-xs ${colors[i % colors.length]}`}>
              {coin.symbol}
            </span>
          )
        })}
      </div>
    </button>
  )
}

// ─── Swap Panel ──────────────────────────────────────────────────────────────

function SwapPanel({ pool }: { pool: CurvePoolData }) {
  const { address } = useAccount()
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(1)
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [txHash, setTxHash] = useState<Address | undefined>()

  const fromCoin = pool.coins[fromIdx]
  const toCoin = pool.coins[toIdx]

  const amountInBig = amountIn
    ? (() => {
        try { return parseUnits(amountIn, fromCoin.decimals) } catch { return 0n }
      })()
    : 0n

  // Preview
  const { data: previewOut } = useReadContract({
    address: pool.address as Address,
    abi: CURVE_POOL_ABI,
    functionName: 'get_dy',
    args: [BigInt(fromIdx), BigInt(toIdx), amountInBig],
    query: { enabled: amountInBig > 0n },
  })

  const minOut = previewOut
    ? (previewOut * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    : 0n

  // Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromCoin.address as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, pool.address as Address],
    query: { enabled: !!address },
  })

  // User balance
  const { data: userBalance } = useReadContract({
    address: fromCoin.address as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  })

  const needsApproval = allowance !== undefined && amountInBig > 0n && allowance < amountInBig

  const { writeContract, isPending: isWritePending } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isTxSuccess) {
      setAmountIn('')
      setTxHash(undefined)
      refetchAllowance()
    }
  }, [isTxSuccess, refetchAllowance])

  const handleApprove = () => {
    writeContract(
      {
        address: fromCoin.address as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [pool.address as Address, amountInBig],
      },
      { onSuccess: (hash) => { setTxHash(hash); refetchAllowance() } }
    )
  }

  const handleSwap = () => {
    writeContract(
      {
        address: pool.address as Address,
        abi: CURVE_POOL_ABI,
        functionName: 'exchange',
        args: [BigInt(fromIdx), BigInt(toIdx), amountInBig, minOut],
      },
      { onSuccess: (hash) => setTxHash(hash) }
    )
  }

  const isLoading = isWritePending || isTxPending

  return (
    <div className="space-y-4">
      {/* From */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-clear-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">From</span>
          {userBalance !== undefined && (
            <button
              onClick={() => setAmountIn(formatUnits(userBalance, fromCoin.decimals))}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Max: {formatAmount(userBalance.toString(), fromCoin.decimals, 4)}
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-xl font-medium text-white outline-none placeholder-slate-600"
          />
          <select
            value={fromIdx}
            onChange={(e) => {
              const val = Number(e.target.value)
              setFromIdx(val)
              if (val === toIdx) setToIdx(val === 0 ? 1 : 0)
            }}
            className="bg-slate-700 border border-clear-border rounded-lg px-3 py-1.5 text-sm text-white outline-none cursor-pointer"
          >
            {pool.coins.map((coin, i) => (
              <option key={i} value={i}>{coin.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <button
          onClick={() => { setFromIdx(toIdx); setToIdx(fromIdx) }}
          className="w-8 h-8 rounded-full bg-slate-700 border border-clear-border flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-clear-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">To (estimated)</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 text-xl font-medium text-slate-300">
            {previewOut !== undefined && amountInBig > 0n
              ? formatAmount(previewOut.toString(), toCoin.decimals, 6)
              : '—'}
          </div>
          <select
            value={toIdx}
            onChange={(e) => {
              const val = Number(e.target.value)
              setToIdx(val)
              if (val === fromIdx) setFromIdx(val === 0 ? 1 : 0)
            }}
            className="bg-slate-700 border border-clear-border rounded-lg px-3 py-1.5 text-sm text-white outline-none cursor-pointer"
          >
            {pool.coins.map((coin, i) => (
              <option key={i} value={i}>{coin.symbol}</option>
            ))}
          </select>
        </div>
        {previewOut !== undefined && amountInBig > 0n && (
          <p className="text-xs text-slate-500 mt-2">
            Min received: {formatAmount(minOut.toString(), toCoin.decimals, 6)} {toCoin.symbol}
          </p>
        )}
      </div>

      {/* Slippage */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Slippage:</span>
        {[0.1, 0.5, 1].map((s) => (
          <button
            key={s}
            onClick={() => setSlippage(s)}
            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
              slippage === s
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-clear-border text-slate-400 hover:border-slate-500'
            }`}
          >
            {s}%
          </button>
        ))}
      </div>

      {/* Success */}
      {isTxSuccess && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          Swap executed successfully!
        </div>
      )}

      {/* Action Button */}
      {!address ? (
        <div className="text-center text-sm text-slate-400 py-2">Connect wallet to swap</div>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
        >
          {isLoading ? 'Approving…' : `Approve ${fromCoin.symbol}`}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={isLoading || !amountIn || amountInBig === 0n}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {isLoading ? 'Swapping…' : 'Swap'}
        </button>
      )}
    </div>
  )
}

// ─── Deposit Panel ───────────────────────────────────────────────────────────

function DepositPanel({ pool }: { pool: CurvePoolData }) {
  const { address } = useAccount()
  const nCoins = pool.coins.length
  const [amounts, setAmounts] = useState<string[]>(pool.coins.map(() => ''))
  const [txHash, setTxHash] = useState<Address | undefined>()
  const [approveIdx, setApproveIdx] = useState<number | null>(null)

  const amountsBig = amounts.map((a, i) => {
    try { return parseUnits(a || '0', pool.coins[i].decimals) } catch { return 0n }
  })

  const addLiqAbi = nCoins === 2 ? CURVE_POOL_2COIN_ABI : CURVE_POOL_5COIN_ABI

  // Preview LP out
  const { data: previewLP } = useReadContract({
    address: pool.address as Address,
    abi: addLiqAbi,
    functionName: 'calc_token_amount',
    args: nCoins === 2
      ? [[amountsBig[0], amountsBig[1]], true]
      : [[amountsBig[0], amountsBig[1], amountsBig[2], amountsBig[3], amountsBig[4]], true],
    query: { enabled: amountsBig.some((a) => a > 0n) },
  } as Parameters<typeof useReadContract>[0])

  const minLP = previewLP != null ? ((previewLP as bigint) * 99n) / 100n : 0n

  // Allowances for each coin
  const allowanceQueries = pool.coins.map((coin) => ({
    address: coin.address as Address,
    abi: ERC20_ABI,
    functionName: 'allowance' as const,
    args: [address!, pool.address as Address] as [Address, Address],
    query: { enabled: !!address },
  }))

  const { data: allowance0, refetch: refetch0 } = useReadContract(allowanceQueries[0])
  const { data: allowance1, refetch: refetch1 } = useReadContract(allowanceQueries[1])
  const { data: allowance2, refetch: refetch2 } = useReadContract(allowanceQueries[2] ?? allowanceQueries[0])
  const { data: allowance3, refetch: refetch3 } = useReadContract(allowanceQueries[3] ?? allowanceQueries[0])
  const { data: allowance4, refetch: refetch4 } = useReadContract(allowanceQueries[4] ?? allowanceQueries[0])

  const allowances = [allowance0, allowance1, allowance2, allowance3, allowance4].slice(0, nCoins)
  const refetches = [refetch0, refetch1, refetch2, refetch3, refetch4].slice(0, nCoins)

  // User balances
  const { data: bal0 } = useReadContract({ address: pool.coins[0]?.address as Address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!], query: { enabled: !!address } })
  const { data: bal1 } = useReadContract({ address: pool.coins[1]?.address as Address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!], query: { enabled: !!address && !!pool.coins[1] } })
  const { data: bal2 } = useReadContract({ address: pool.coins[2]?.address as Address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!], query: { enabled: !!address && !!pool.coins[2] } })
  const { data: bal3 } = useReadContract({ address: pool.coins[3]?.address as Address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!], query: { enabled: !!address && !!pool.coins[3] } })
  const { data: bal4 } = useReadContract({ address: pool.coins[4]?.address as Address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!], query: { enabled: !!address && !!pool.coins[4] } })
  const balances = [bal0, bal1, bal2, bal3, bal4].slice(0, nCoins)

  // Find first coin needing approval
  const firstNeedsApproval = amountsBig.findIndex(
    (a, i) => a > 0n && allowances[i] !== undefined && (allowances[i] as bigint) < a
  )

  const { writeContract, isPending: isWritePending } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isTxSuccess) {
      if (approveIdx !== null) {
        refetches[approveIdx]()
        setApproveIdx(null)
      } else {
        setAmounts(pool.coins.map(() => ''))
      }
      setTxHash(undefined)
    }
  }, [isTxSuccess])

  const handleApprove = (idx: number) => {
    setApproveIdx(idx)
    writeContract(
      {
        address: pool.coins[idx].address as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [pool.address as Address, amountsBig[idx]],
      },
      { onSuccess: (hash) => setTxHash(hash) }
    )
  }

  const handleDeposit = () => {
    if (nCoins === 2) {
      writeContract(
        {
          address: pool.address as Address,
          abi: CURVE_POOL_2COIN_ABI,
          functionName: 'add_liquidity',
          args: [[amountsBig[0], amountsBig[1]], minLP],
        },
        { onSuccess: (hash) => setTxHash(hash) }
      )
    } else {
      writeContract(
        {
          address: pool.address as Address,
          abi: CURVE_POOL_5COIN_ABI,
          functionName: 'add_liquidity',
          args: [[amountsBig[0], amountsBig[1], amountsBig[2], amountsBig[3], amountsBig[4]], minLP],
        },
        { onSuccess: (hash) => setTxHash(hash) }
      )
    }
  }

  const isLoading = isWritePending || isTxPending
  const hasAnyAmount = amountsBig.some((a) => a > 0n)

  return (
    <div className="space-y-3">
      {pool.coins.map((coin, i) => (
        <div key={i} className="bg-slate-800/60 rounded-xl p-3 border border-clear-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-slate-300">{coin.symbol}</span>
            {balances[i] !== undefined && (
              <button
                onClick={() => {
                  const next = [...amounts]
                  next[i] = formatUnits(balances[i] as bigint, coin.decimals)
                  setAmounts(next)
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Max: {formatAmount((balances[i] as bigint).toString(), coin.decimals, 4)}
              </button>
            )}
          </div>
          <input
            type="number"
            value={amounts[i]}
            onChange={(e) => {
              const next = [...amounts]
              next[i] = e.target.value
              setAmounts(next)
            }}
            placeholder="0.00"
            className="w-full bg-transparent text-lg font-medium text-white outline-none placeholder-slate-600"
          />
          {amountsBig[i] > 0n && allowances[i] !== undefined && (allowances[i] as bigint) < amountsBig[i] && (
            <button
              onClick={() => handleApprove(i)}
              disabled={isLoading}
              className="mt-2 w-full py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              {isLoading && approveIdx === i ? 'Approving…' : `Approve ${coin.symbol}`}
            </button>
          )}
        </div>
      ))}

      {previewLP != null && hasAnyAmount && (
        <div className="bg-slate-800/40 rounded-lg px-3 py-2 border border-clear-border text-sm">
          <span className="text-slate-400">You will receive: </span>
          <span className="text-white font-medium">
            {formatAmount((previewLP as bigint).toString(), 18, 6)} {pool.symbol} LP
          </span>
        </div>
      )}

      {isTxSuccess && !approveIdx && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          Liquidity added successfully!
        </div>
      )}

      {!address ? (
        <div className="text-center text-sm text-slate-400 py-2">Connect wallet to deposit</div>
      ) : (
        <button
          onClick={handleDeposit}
          disabled={isLoading || !hasAnyAmount || firstNeedsApproval !== -1}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {isLoading && approveIdx === null ? 'Depositing…' : 'Add Liquidity'}
        </button>
      )}
    </div>
  )
}

// ─── Withdraw Panel ──────────────────────────────────────────────────────────

function WithdrawPanel({ pool }: { pool: CurvePoolData }) {
  const { address } = useAccount()
  const [lpAmount, setLpAmount] = useState('')
  const [withdrawIdx, setWithdrawIdx] = useState(0)
  const [txHash, setTxHash] = useState<Address | undefined>()

  // We need the LP token address - for Curve, try lp_token() then token()
  const { data: lpTokenAddr } = useReadContract({
    address: pool.address as Address,
    abi: CURVE_POOL_ABI,
    functionName: 'lp_token',
  })

  const lpToken = (lpTokenAddr as Address | undefined) ?? (pool.address as Address)

  const lpAmountBig = lpAmount
    ? (() => { try { return parseUnits(lpAmount, 18) } catch { return 0n } })()
    : 0n

  // User LP balance
  const { data: lpBalance } = useReadContract({
    address: lpToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  })

  // LP allowance
  const { data: lpAllowance, refetch: refetchLpAllowance } = useReadContract({
    address: lpToken,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, pool.address as Address],
    query: { enabled: !!address },
  })

  // Preview withdraw one coin
  const { data: previewOut } = useReadContract({
    address: pool.address as Address,
    abi: CURVE_POOL_ABI,
    functionName: 'calc_withdraw_one_coin',
    args: [lpAmountBig, BigInt(withdrawIdx)],
    query: { enabled: lpAmountBig > 0n },
  })

  const minOut = previewOut ? (previewOut * 99n) / 100n : 0n
  const needsApproval = lpAllowance !== undefined && lpAmountBig > 0n && lpAllowance < lpAmountBig

  const { writeContract, isPending: isWritePending } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isTxSuccess) {
      setLpAmount('')
      setTxHash(undefined)
      refetchLpAllowance()
    }
  }, [isTxSuccess, refetchLpAllowance])

  const handleApprove = () => {
    writeContract(
      {
        address: lpToken,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [pool.address as Address, lpAmountBig],
      },
      { onSuccess: (hash) => { setTxHash(hash) } }
    )
  }

  const handleWithdraw = () => {
    writeContract(
      {
        address: pool.address as Address,
        abi: CURVE_POOL_ABI,
        functionName: 'remove_liquidity_one_coin',
        args: [lpAmountBig, BigInt(withdrawIdx), minOut],
      },
      { onSuccess: (hash) => setTxHash(hash) }
    )
  }

  const isLoading = isWritePending || isTxPending

  return (
    <div className="space-y-4">
      {/* LP Amount */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-clear-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">{pool.symbol} LP to burn</span>
          {lpBalance !== undefined && (
            <button
              onClick={() => setLpAmount(formatUnits(lpBalance, 18))}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Max: {formatAmount(lpBalance.toString(), 18, 4)}
            </button>
          )}
        </div>
        <input
          type="number"
          value={lpAmount}
          onChange={(e) => setLpAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-transparent text-xl font-medium text-white outline-none placeholder-slate-600"
        />
      </div>

      {/* Receive token */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-clear-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Receive token</span>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex-1 text-xl font-medium text-slate-300">
            {previewOut !== undefined && lpAmountBig > 0n
              ? formatAmount(previewOut.toString(), pool.coins[withdrawIdx].decimals, 6)
              : '—'}
          </div>
          <select
            value={withdrawIdx}
            onChange={(e) => setWithdrawIdx(Number(e.target.value))}
            className="bg-slate-700 border border-clear-border rounded-lg px-3 py-1.5 text-sm text-white outline-none cursor-pointer"
          >
            {pool.coins.map((coin, i) => (
              <option key={i} value={i}>{coin.symbol}</option>
            ))}
          </select>
        </div>
        {previewOut !== undefined && lpAmountBig > 0n && (
          <p className="text-xs text-slate-500 mt-2">
            Min received: {formatAmount(minOut.toString(), pool.coins[withdrawIdx].decimals, 6)} {pool.coins[withdrawIdx].symbol}
          </p>
        )}
      </div>

      {isTxSuccess && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          Withdrawal successful!
        </div>
      )}

      {!address ? (
        <div className="text-center text-sm text-slate-400 py-2">Connect wallet to withdraw</div>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
        >
          {isLoading ? 'Approving LP…' : 'Approve LP Token'}
        </button>
      ) : (
        <button
          onClick={handleWithdraw}
          disabled={isLoading || !lpAmount || lpAmountBig === 0n}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {isLoading ? 'Withdrawing…' : 'Remove Liquidity'}
        </button>
      )}
    </div>
  )
}

// ─── Pool Detail ─────────────────────────────────────────────────────────────

function PoolDetail({ pool }: { pool: CurvePoolData }) {
  const { getAddressUrl } = useExplorer()
  const [tab, setTab] = useState<ActionTab>('swap')
  const totalBalance = pool.coins.reduce((s, c) => s + Number(c.balance) / 10 ** c.decimals, 0)
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500']
  const textColors = ['text-blue-400', 'text-purple-400', 'text-teal-400', 'text-orange-400', 'text-pink-400']

  return (
    <div className="space-y-4">
      {/* Pool info */}
      <div className="bg-clear-card border border-clear-border rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{pool.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  pool.poolType === 'base'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {pool.poolType === 'base' ? 'Base Pool' : 'Meta Pool'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {pool.address.slice(0, 8)}…{pool.address.slice(-6)}
              </span>
            </div>
          </div>
          <a
            href={getAddressUrl(pool.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-300"
          >
            ↗
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Fee</p>
            <p className="text-sm font-semibold text-white">{formatFee(pool.fee)}</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">A Factor</p>
            <p className="text-sm font-semibold text-white">{Number(pool.a).toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Virtual Price</p>
            <p className="text-sm font-semibold text-white">${formatVirtualPrice(pool.virtualPrice)}</p>
          </div>
        </div>

        {/* Coins breakdown */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Pool Composition</p>
          <div className="flex gap-0.5 rounded-full overflow-hidden h-2 mb-3">
            {pool.coins.map((coin, i) => {
              const pct = totalBalance > 0 ? (Number(coin.balance) / 10 ** coin.decimals) / totalBalance : 1 / pool.coins.length
              return (
                <div
                  key={i}
                  className={`${colors[i % colors.length]} h-full`}
                  style={{ width: `${(pct * 100).toFixed(1)}%` }}
                />
              )
            })}
          </div>
          <div className="space-y-2">
            {pool.coins.map((coin, i) => {
              const balance = Number(coin.balance) / 10 ** coin.decimals
              const pct = totalBalance > 0 ? (balance / totalBalance) * 100 : 100 / pool.coins.length
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                    <span className="text-sm text-slate-300">{coin.symbol}</span>
                    {coin.decimals <= 6 && (
                      <span className="text-xs text-slate-500">({coin.decimals}d)</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${textColors[i % textColors.length]}`}>
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      {balance >= 1e6
                        ? `${(balance / 1e6).toFixed(2)}M`
                        : balance >= 1e3
                        ? `${(balance / 1e3).toFixed(1)}K`
                        : balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-clear-border flex justify-between text-sm">
            <span className="text-slate-400">Total Liquidity</span>
            <span className="text-white font-medium">
              {totalBalance >= 1e6
                ? `$${(totalBalance / 1e6).toFixed(2)}M`
                : totalBalance >= 1e3
                ? `$${(totalBalance / 1e3).toFixed(1)}K`
                : `$${totalBalance.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Panel */}
      <div className="bg-clear-card border border-clear-border rounded-xl p-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/80 rounded-xl mb-5">
          {(['swap', 'deposit', 'withdraw'] as ActionTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'swap' && <SwapPanel pool={pool} />}
        {tab === 'deposit' && <DepositPanel pool={pool} />}
        {tab === 'withdraw' && <WithdrawPanel pool={pool} />}
      </div>

      {/* Recent Swaps */}
      {pool.swaps.length > 0 && (
        <div className="bg-clear-card border border-clear-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Swaps</h3>
          <div className="space-y-2">
            {pool.swaps.slice(0, 10).map((swap, i) => {
              const fromCoin = pool.coins[swap.soldId]
              const toCoin = pool.coins[swap.boughtId]
                ?? { symbol: `Coin[${swap.boughtId}]`, decimals: 18 }
              const soldAmt = fromCoin
                ? formatAmount(swap.tokensSold, fromCoin.decimals, 4)
                : swap.tokensSold
              const boughtAmt = toCoin
                ? formatAmount(swap.tokensBought, toCoin.decimals, 4)
                : swap.tokensBought
              const time = new Date(Number(swap.timestamp) * 1000).toLocaleString()
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-clear-border last:border-0 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="font-medium">{soldAmt}</span>
                    <span className="text-slate-500">{fromCoin?.symbol}</span>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium">{boughtAmt}</span>
                    <span className="text-slate-500">{toCoin?.symbol}</span>
                    {swap.isUnderlying && (
                      <span className="text-purple-400">(underlying)</span>
                    )}
                  </div>
                  <span className="text-slate-500">{time}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CurvePools() {
  const chainId = useChainId()
  const [selectedPool, setSelectedPool] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['curvePools', chainId],
    queryFn: async () => {
      const res = await getGraphQLClient(chainId).request<{ curvePools: CurvePoolData[] }>(GET_CURVE_POOLS)
      return res.curvePools
    },
    refetchInterval: 30_000,
  })

  const pools = data ?? []
  const selected = pools.find((p) => p.id === selectedPool) ?? pools[0] ?? null

  // Auto-select first pool
  useEffect(() => {
    if (pools.length > 0 && !selectedPool) {
      setSelectedPool(pools[0].id)
    }
  }, [pools])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm">Loading curve pools…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-400 text-sm">Failed to load curve pools.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Curve Pools</h1>
        <p className="text-sm text-slate-400 mt-1">
          Stableswap liquidity pools — deposit, withdraw and swap stablecoins
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pool list */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pools ({pools.length})</p>
          {pools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              selected={selected?.id === pool.id}
              onClick={() => setSelectedPool(pool.id)}
            />
          ))}
        </div>

        {/* Pool detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <PoolDetail key={selected.id} pool={selected} />
          ) : (
            <div className="bg-clear-card border border-clear-border rounded-xl p-10 text-center text-slate-400 text-sm">
              Select a pool to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
