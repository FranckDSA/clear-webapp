import { useState } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { TOKENS, ERC20_ABI } from '../config/contracts'

const TOKEN_LIST = Object.values(TOKENS)

const TOKEN_COLORS: Record<string, string> = {
  GHO: 'from-purple-500 to-purple-700',
  USDC: 'from-blue-500 to-blue-700',
  USDe: 'from-emerald-500 to-emerald-700',
  USDS: 'from-sky-500 to-sky-700',
  USDT: 'from-teal-500 to-teal-700',
}

const PRESETS = [
  { label: '100', value: '100' },
  { label: '1 000', value: '1000' },
  { label: '10 000', value: '10000' },
  { label: '100 000', value: '100000' },
]

type MintState = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

function TokenMintCard({
  token,
  balance,
  onMintSuccess,
}: {
  token: { address: Address; symbol: string; decimals: number }
  balance: bigint | undefined
  onMintSuccess: () => void
}) {
  const { address: userAddress } = useAccount()
  const [amount, setAmount] = useState('')
  const [mintState, setMintState] = useState<MintState>('idle')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [errorMsg, setErrorMsg] = useState('')

  const { writeContract, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Sync success state
  if (isSuccess && mintState === 'confirming') {
    setMintState('success')
    onMintSuccess()
  }
  if (isConfirming && mintState === 'pending') {
    setMintState('confirming')
  }

  const parsedAmount =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, token.decimals)
      : 0n

  const formattedBalance =
    balance !== undefined
      ? Number(formatUnits(balance, token.decimals)).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '—'

  function handleMint() {
    if (!userAddress || parsedAmount === 0n) return
    setErrorMsg('')
    setMintState('pending')
    setTxHash(undefined)
    writeContract(
      {
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [userAddress, parsedAmount],
      },
      {
        onSuccess(hash) {
          setTxHash(hash)
        },
        onError(err) {
          setMintState('error')
          const msg = err.message?.includes('User rejected') ? 'Transaction rejected' : err.message ?? 'Transaction failed'
          setErrorMsg(msg.length > 80 ? msg.slice(0, 80) + '…' : msg)
        },
      }
    )
  }

  const isBusy = isPending || isConfirming || mintState === 'pending' || mintState === 'confirming'

  const colorClass = TOKEN_COLORS[token.symbol] ?? 'from-slate-500 to-slate-700'

  return (
    <div className="bg-clear-card border border-clear-border rounded-xl p-5 flex flex-col gap-4">
      {/* Token header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {token.symbol.slice(0, 2)}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">{token.symbol}</p>
            <p className="text-slate-400 text-xs mt-0.5">ERC-20 · {token.decimals} decimals</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Balance</p>
          <p className="text-white font-mono text-sm">{formattedBalance}</p>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => setAmount(preset.value)}
            disabled={isBusy}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              amount === preset.value
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-clear-border text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="relative">
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            if (mintState === 'success' || mintState === 'error') setMintState('idle')
          }}
          placeholder="Amount"
          disabled={isBusy}
          className="w-full bg-slate-900 border border-clear-border rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-16"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium pointer-events-none">
          {token.symbol}
        </span>
      </div>

      {/* Mint button */}
      <button
        onClick={handleMint}
        disabled={!userAddress || parsedAmount === 0n || isBusy}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white"
      >
        {isBusy ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {mintState === 'pending' ? 'Confirm in wallet…' : 'Confirming…'}
          </span>
        ) : (
          `Mint ${token.symbol}`
        )}
      </button>

      {/* Status messages */}
      {mintState === 'success' && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Mint successful!</span>
          {txHash && (
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto underline hover:text-emerald-300"
            >
              View tx ↗
            </a>
          )}
        </div>
      )}
      {mintState === 'error' && errorMsg && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}

export function Mint() {
  const { address: userAddress } = useAccount()

  // Batch-read all token balances
  const { data: balancesData, refetch: refetchBalances } = useReadContracts({
    contracts: TOKEN_LIST.map((token) => ({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf' as const,
      args: [userAddress ?? '0x0000000000000000000000000000000000000000'] as [Address],
    })),
    query: { enabled: !!userAddress },
  })

  const balances: (bigint | undefined)[] = TOKEN_LIST.map((_, i) => {
    const result = balancesData?.[i]
    return result?.status === 'success' ? (result.result as bigint) : undefined
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white leading-none">Testnet Faucet</h2>
          <p className="text-slate-400 text-sm mt-0.5">Mint test tokens on Arbitrum Sepolia</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
          Testnet only
        </span>
      </div>

      {/* Connect wallet prompt */}
      {!userAddress && (
        <div className="bg-clear-card border border-clear-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3H3m9-3v3" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium">Connect your wallet</p>
          <p className="text-slate-500 text-sm mt-1">Connect a wallet to mint testnet tokens</p>
        </div>
      )}

      {/* Token cards grid */}
      {userAddress && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOKEN_LIST.map((token, i) => (
            <TokenMintCard
              key={token.address}
              token={token}
              balance={balances[i]}
              onMintSuccess={() => refetchBalances()}
            />
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-slate-800/60 border border-clear-border rounded-xl px-4 py-3">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
        <span>
          These are testnet ERC-20 tokens deployed on Arbitrum Sepolia. They have no real-world value.
          The <code className="font-mono bg-slate-700 px-1 rounded">mint</code> function is publicly callable on each token contract.
        </span>
      </div>
    </div>
  )
}
