import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseUnits, formatUnits, maxUint256 } from 'viem'
import { useQuery } from '@tanstack/react-query'
import {
  ERC20_ABI,
  CLEAR_SWAP_ABI,
} from '../config/contracts'
import { getGraphQLClient, CLEAR_ROUTE_QUERY, ClearRouteResult } from '../lib/graphql'
import { useChainConfig } from '../hooks/useChainConfig'
import { useExplorer } from '../hooks/useExplorer'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function Swap() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const { getTxUrl } = useExplorer()
  const { addresses, tokens } = useChainConfig()

  const TOKEN_LIST = Object.values(tokens)
  const [fallbackVaultAddress, setFallbackVaultAddress] = useState<`0x${string}`>(addresses.defaultVault)
  const [fromToken, setFromToken] = useState(TOKEN_LIST[1]) // USDC
  const [toToken, setToToken] = useState(TOKEN_LIST[4]) // USDT
  const [amountIn, setAmountIn] = useState('')
  const [receiveIOU, setReceiveIOU] = useState(false)
  const [slippage, setSlippage] = useState('0.5')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()

  const debouncedAmountIn = useDebounce(amountIn, 400)

  // Update vault address when chain changes
  useEffect(() => {
    setFallbackVaultAddress(addresses.defaultVault)
  }, [addresses.defaultVault])

  const parsedAmountIn =
    debouncedAmountIn && !isNaN(Number(debouncedAmountIn)) && Number(debouncedAmountIn) > 0
      ? parseUnits(debouncedAmountIn, fromToken.decimals)
      : 0n

  const routeEnabled = parsedAmountIn > 0n && fromToken.address !== toToken.address && !!userAddress

  // ─── Primary: GraphQL clearRoute ────────────────────────────────────────────
  const {
    data: routeData,
    isLoading: routeLoading,
    error: routeError,
    isFetching: routeFetching,
  } = useQuery({
    queryKey: ['clearRoute', chainId, userAddress, fromToken.address, toToken.address, parsedAmountIn.toString(), receiveIOU],
    queryFn: async () => {
      const res = await getGraphQLClient(chainId).request<{ clearRoute: ClearRouteResult }>(CLEAR_ROUTE_QUERY, {
        receiver: userAddress,
        fromToken: fromToken.address,
        toToken: toToken.address,
        amountIn: parsedAmountIn.toString(),
        receiveIOU,
      })
      return res.clearRoute
    },
    enabled: routeEnabled,
    retry: 1,
    retryDelay: 500,
    staleTime: 10_000,
  })

  // API is considered down when query was attempted and errored
  const graphqlDown = routeEnabled && !!routeError && !routeFetching

  // ─── Fallback: on-chain previewSwap ─────────────────────────────────────────
  const {
    data: previewFallback,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useReadContract({
    address: addresses.clearSwap,
    abi: CLEAR_SWAP_ABI,
    functionName: 'previewSwap',
    args: [fallbackVaultAddress, fromToken.address, toToken.address, parsedAmountIn, receiveIOU],
    query: {
      // Only run when GraphQL is confirmed down or wallet not connected
      enabled: parsedAmountIn > 0n && fromToken.address !== toToken.address && (!userAddress || graphqlDown),
    },
  })

  const { data: depegThreshold } = useReadContract({
    address: addresses.clearSwap,
    abi: CLEAR_SWAP_ABI,
    functionName: 'depegThresholdBps',
  })

  // User balance
  const { data: userBalance } = useReadContract({
    address: fromToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress },
  })

  // Resolve the swap contract and vault to use
  const resolvedSwapContract = (!graphqlDown && routeData?.swapContract
    ? routeData.swapContract
    : addresses.clearSwap) as `0x${string}`

  // Current allowance against the resolved swap contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress!, resolvedSwapContract],
    query: { enabled: !!userAddress },
  })

  const { writeContractAsync: writeApprove, isPending: isApprovePending } = useWriteContract()
  const { writeContractAsync: writeSwap, isPending: isSwapPending } = useWriteContract()

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  })
  const { isLoading: isSwapConfirming, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isApprovalSuccess) refetchAllowance()
  }, [isApprovalSuccess, refetchAllowance])

  // ─── Derived preview values ──────────────────────────────────────────────────
  // GraphQL route takes priority when healthy
  const usingGraphQL = !graphqlDown && !!routeData
  const routeAvailable = usingGraphQL ? routeData!.available : true

  const amountOut: bigint = usingGraphQL && routeData!.amountOut
    ? BigInt(routeData!.amountOut)
    : (previewFallback?.[0] ?? 0n)

  const iousOut: bigint = usingGraphQL && routeData!.iouAmountOut
    ? BigInt(routeData!.iouAmountOut)
    : (previewFallback?.[1] ?? 0n)

  const minAmountOut = amountOut > 0n
    ? amountOut - (amountOut * BigInt(Math.floor(Number(slippage) * 100))) / 10000n
    : 0n

  const isPreviewCalculating = usingGraphQL ? routeLoading || routeFetching : isPreviewLoading

  const needsApproval = allowance !== undefined && parsedAmountIn > 0n && allowance < parsedAmountIn

  // Effective error to show in UI
  const effectiveError: string | null = (() => {
    if (usingGraphQL && routeData && !routeData.available) {
      return routeData.unavaibilityReasons.join(' · ')
    }
    if (graphqlDown && previewError) {
      const msg = previewError.message
      if (msg.includes('AssetIsNotDepeg')) return 'Asset is not depegged — swap unavailable for this direction'
      if (msg.includes('OutAssetIsDepeg')) return 'Output asset is currently depegged'
      return msg
    }
    return null
  })()

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleSwapTokens = () => {
    const tmp = fromToken
    setFromToken(toToken)
    setToToken(tmp)
    setAmountIn('')
  }

  const handleApprove = async () => {
    if (!userAddress) return
    const hash = await writeApprove({
      address: fromToken.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [resolvedSwapContract, maxUint256],
    })
    setApprovalHash(hash)
  }

  const handleSwap = async () => {
    if (!userAddress) return

    const vaultAddr = (!graphqlDown && routeData?.vault
      ? routeData.vault
      : fallbackVaultAddress) as `0x${string}`

    const hash = await writeSwap({
      address: resolvedSwapContract,
      abi: CLEAR_SWAP_ABI,
      functionName: 'swap',
      args: [
        userAddress,
        vaultAddr,
        fromToken.address,
        toToken.address,
        parsedAmountIn,
        minAmountOut,
        receiveIOU,
      ],
    })
    setTxHash(hash)
    setAmountIn('')
  }

  const canSwap = parsedAmountIn > 0n
    && fromToken.address !== toToken.address
    && !effectiveError
    && !isSwapPending
    && !isSwapConfirming
    && (amountOut > 0n)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Swap</h2>
            <p className="text-slate-400 text-sm mt-1">
              Trade stablecoins 1:1 via Clear Protocol
              {depegThreshold !== undefined && (
                <span className="ml-2 text-blue-400">
                  · Depeg threshold: {(Number(depegThreshold) / 100).toFixed(0)} bps
                </span>
              )}
            </p>
          </div>
          {/* Data source badge */}
          <div className="flex-shrink-0 mt-1">
            {graphqlDown ? (
              <span className="inline-flex items-center gap-1.5 text-xs bg-amber-900/30 text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                On-chain fallback
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-900/20 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Indexer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Swap Card */}
      <div className="bg-clear-card border border-clear-border rounded-xl p-4 space-y-3">
        {/* From */}
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">You pay</span>
            {userBalance !== undefined && (
              <button
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => setAmountIn(formatUnits(userBalance, fromToken.decimals))}
              >
                Max: {Number(formatUnits(userBalance, fromToken.decimals)).toLocaleString('en-US', { maximumFractionDigits: 4 })}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.00"
              min="0"
              className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-slate-600 focus:outline-none"
            />
            <select
              value={fromToken.symbol}
              onChange={(e) => {
                const t = TOKEN_LIST.find((t) => t.symbol === e.target.value)!
                setFromToken(t)
                setAmountIn('')
              }}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 font-medium focus:outline-none cursor-pointer"
            >
              {TOKEN_LIST.filter((t) => t.symbol !== toToken.symbol).map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap direction button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 border border-clear-border flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">You receive</span>
            {iousOut > 0n && (
              <span className="text-xs text-purple-400">
                + {formatUnits(iousOut, toToken.decimals)} IOU
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-bold text-white">
              {isPreviewCalculating && parsedAmountIn > 0n ? (
                <span className="text-slate-500 text-lg">Calculating...</span>
              ) : amountOut > 0n ? (
                Number(formatUnits(amountOut, toToken.decimals)).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })
              ) : (
                <span className="text-slate-600">0.00</span>
              )}
            </div>
            <select
              value={toToken.symbol}
              onChange={(e) => {
                const t = TOKEN_LIST.find((t) => t.symbol === e.target.value)!
                setToToken(t)
                setAmountIn('')
              }}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 font-medium focus:outline-none cursor-pointer"
            >
              {TOKEN_LIST.filter((t) => t.symbol !== fromToken.symbol).map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {effectiveError && parsedAmountIn > 0n && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs">
            {effectiveError}
          </div>
        )}

        {/* Settings */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Receive IOU on depeg</span>
            <button
              onClick={() => setReceiveIOU(!receiveIOU)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                receiveIOU ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  receiveIOU ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Slippage:</span>
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              min="0.1"
              max="10"
              step="0.1"
              className="w-16 bg-slate-700 border border-clear-border rounded px-2 py-0.5 text-xs text-white text-center focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">%</span>
          </div>
        </div>

        {/* Rate info */}
        {amountOut > 0n && parsedAmountIn > 0n && routeAvailable && (
          <div className="bg-slate-900/50 rounded-lg px-3 py-2 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Rate</span>
              <span className="text-white">
                1 {fromToken.symbol} ≈{' '}
                {(Number(formatUnits(amountOut, toToken.decimals)) /
                  Number(formatUnits(parsedAmountIn, fromToken.decimals))).toFixed(6)}{' '}
                {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Min received</span>
              <span className="text-white">
                {Number(formatUnits(minAmountOut, toToken.decimals)).toFixed(6)} {toToken.symbol}
              </span>
            </div>
            {usingGraphQL && routeData?.vault && (
              <div className="flex justify-between">
                <span>Vault</span>
                <span className="text-white font-mono text-xs">
                  {routeData.vault.slice(0, 6)}…{routeData.vault.slice(-4)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fallback vault input — only shown when GraphQL is down */}
      {graphqlDown && (
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">
            Vault <span className="text-amber-400">(on-chain fallback)</span>
          </label>
          <input
            type="text"
            value={fallbackVaultAddress}
            onChange={(e) => setFallbackVaultAddress(e.target.value as `0x${string}`)}
            className="w-full bg-slate-800 border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* Action buttons */}
      {!userAddress ? (
        <div className="text-center text-slate-400 text-sm py-2">Connect wallet to swap</div>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isApprovePending || isApprovalConfirming}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {isApprovePending || isApprovalConfirming
            ? 'Approving...'
            : `Approve ${fromToken.symbol}`}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={!canSwap}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {isSwapPending || isSwapConfirming ? 'Swapping...' : 'Swap'}
        </button>
      )}

      {/* Tx success */}
      {isSwapSuccess && txHash && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 text-sm">
          <p className="text-emerald-400 font-medium">Swap successful!</p>
          <a
            href={getTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-xs font-mono mt-1 block"
          >
            {txHash.slice(0, 20)}...{txHash.slice(-10)} ↗
          </a>
        </div>
      )}

      {isApprovalSuccess && approvalHash && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 text-sm text-emerald-400">
          Approval confirmed. You can now swap.
        </div>
      )}
    </div>
  )
}
