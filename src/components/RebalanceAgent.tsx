import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi'
import { formatUnits, parseUnits, maxUint256, isAddress } from 'viem'
import {
  ERC20_ABI,
  getTokenByAddress,
  CLEAR_REBALANCE_AGENT_ABI,
} from '../config/contracts'
import { useChainConfig } from '../hooks/useChainConfig'

// ─── helpers ───────────────────────────────────────────────────────────────

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

function fmtTokenAmount(amount: bigint, decimals: number) {
  const n = Number(formatUnits(amount, decimals))
  if (n >= 1e6) return `${(n / 1e6).toFixed(4)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(4)}K`
  return n.toFixed(6)
}

// ─── sub-components ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-clear-card border border-clear-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-clear-border">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function TxButton({
  onClick,
  disabled,
  pending,
  label,
  pendingLabel,
  variant = 'blue',
}: {
  onClick: () => void
  disabled?: boolean
  pending?: boolean
  label: string
  pendingLabel: string
  variant?: 'blue' | 'purple' | 'amber' | 'red' | 'emerald'
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-500',
    purple: 'bg-purple-600 hover:bg-purple-500',
    amber: 'bg-amber-600 hover:bg-amber-500',
    red: 'bg-red-600 hover:bg-red-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-500',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || pending}
      className={`${colors[variant]} disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

function TxStatus({ hash, successMsg }: { hash: `0x${string}` | undefined; successMsg: string }) {
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })
  if (!hash) return null
  if (isLoading) return <p className="text-slate-400 text-xs">Waiting for confirmation…</p>
  if (isSuccess)
    return (
      <p className="text-emerald-400 text-xs">
        {successMsg}{' '}
        <a
          href={`https://sepolia.arbiscan.io/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          View tx
        </a>
      </p>
    )
  return null
}

function InlineError({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <p className="text-red-400 text-xs break-all">{msg}</p>
}

// ─── main component ────────────────────────────────────────────────────────

export function RebalanceAgent() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const { addresses, tokens } = useChainConfig()

  const AGENT = addresses.clearRebalanceAgent
  const TOKEN_LIST = Object.values(tokens)

  // Check if agent is available on this chain
  if (!AGENT || AGENT === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Rebalance Agent</h2>
          <p className="text-slate-400 text-sm mt-1">Manage the ClearRebalanceAgent contract</p>
        </div>
        <div className="bg-clear-card border border-clear-border rounded-xl p-8 text-center">
          <p className="text-slate-400">Rebalance Agent is not available on this chain</p>
        </div>
      </div>
    )
  }

  // ── contract reads ──────────────────────────────────────────────────────
  const { data: owner } = useReadContract({
    address: AGENT,
    abi: CLEAR_REBALANCE_AGENT_ABI,
    functionName: 'owner',
  })

  const { data: tokenBalancesData, refetch: refetchBalances } = useReadContract({
    address: AGENT,
    abi: CLEAR_REBALANCE_AGENT_ABI,
    functionName: 'tokenBalances',
  })

  const tokenAddresses = (tokenBalancesData?.[0] ?? []) as readonly `0x${string}`[]
  const tokenAmounts = (tokenBalancesData?.[1] ?? []) as readonly bigint[]

  const { data: tokenDetailsData } = useReadContracts({
    contracts: tokenAddresses.map((addr) => ({
      address: AGENT,
      abi: CLEAR_REBALANCE_AGENT_ABI,
      functionName: 'tokens' as const,
      args: [addr] as const,
    })),
  })

  const isOwner =
    !!userAddress && !!owner && userAddress.toLowerCase() === owner.toLowerCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Rebalance Agent</h2>
          <p className="text-slate-400 text-sm mt-1">Manage the ClearRebalanceAgent contract</p>
        </div>
        <a
          href={`https://sepolia.arbiscan.io/address/${AGENT}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
        >
          {shortAddr(AGENT)} ↗
        </a>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-clear-card border border-clear-border rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Owner</p>
          {owner ? (
            <a
              href={`https://sepolia.arbiscan.io/address/${owner}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono text-blue-400 hover:text-blue-300 transition-colors break-all"
            >
              {owner}
            </a>
          ) : (
            <p className="text-white font-mono text-sm">—</p>
          )}
        </div>
        <div className="bg-clear-card border border-clear-border rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Configured Tokens</p>
          <p className="text-2xl font-bold text-white">{tokenAddresses.length}</p>
        </div>
      </div>

      {/* Token balances */}
      <SectionCard title="Token Balances">
        {tokenAddresses.length === 0 ? (
          <p className="text-slate-500 text-sm">No tokens configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-2 text-left">Token</th>
                  <th className="py-2 text-right">Balance</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {tokenAddresses.map((addr, i) => {
                  const info = getTokenByAddress(addr, chainId)
                  const symbol = info?.symbol ?? shortAddr(addr)
                  const detail = tokenDetailsData?.[i]?.result as
                    | [boolean, number]
                    | undefined
                  const enabled = detail?.[0]
                  const decimals = detail?.[1] ?? (info?.decimals ?? 18)
                  const amount = tokenAmounts[i] ?? 0n

                  return (
                    <tr key={addr} className="border-t border-clear-border hover:bg-slate-800/40">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-white font-medium">{symbol}</p>
                            <p className="text-xs text-slate-500 font-mono">{shortAddr(addr)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono text-white">
                        {fmtTokenAmount(amount, Number(decimals))}
                      </td>
                      <td className="py-3 text-right">
                        {enabled === undefined ? (
                          <span className="text-slate-500 text-xs">—</span>
                        ) : enabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Owner-only notice */}
      {userAddress && !isOwner && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-sm">
          Connected address is not the contract owner — management actions are disabled.
        </div>
      )}
      {!userAddress && (
        <div className="bg-slate-800/60 border border-clear-border rounded-xl p-3 text-slate-400 text-sm">
          Connect your wallet to use management actions.
        </div>
      )}

      {/* Management grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConfigureTokenCard isOwner={isOwner} agentAddress={AGENT} tokenList={TOKEN_LIST} />
        <ConfigureRouteCard isOwner={isOwner} agentAddress={AGENT} tokenList={TOKEN_LIST} />
        <LiquidityCard
          isOwner={isOwner}
          tokenAddresses={tokenAddresses}
          tokenDetailsData={tokenDetailsData}
          onSuccess={refetchBalances}
          agentAddress={AGENT}
          tokenList={TOKEN_LIST}
        />
        <WhitelistCard isOwner={isOwner} agentAddress={AGENT} />
      </div>
    </div>
  )
}

// ─── ConfigureTokenCard ────────────────────────────────────────────────────

function ConfigureTokenCard({ isOwner, agentAddress, tokenList }: { isOwner: boolean; agentAddress: `0x${string}`; tokenList: Array<{ address: `0x${string}`; symbol: string; decimals: number }> }) {
  const [tokenAddr, setTokenAddr] = useState(tokenList[0].address)
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const [err, setErr] = useState<string | null>(null)

  const { writeContractAsync } = useWriteContract()
  const { isLoading: isPending } = useWaitForTransactionReceipt({ hash })

  async function handle() {
    setErr(null)
    try {
      const h = await writeContractAsync({
        address: agentAddress,
        abi: CLEAR_REBALANCE_AGENT_ABI,
        functionName: 'configureToken',
        args: [tokenAddr as `0x${string}`],
      })
      setHash(h)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('User rejected')) setErr(msg.slice(0, 120))
    }
  }

  return (
    <SectionCard title="Configure Token">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider">Token</label>
          <select
            value={tokenAddr}
            onChange={(e) => setTokenAddr(e.target.value as `0x${string}`)}
            disabled={!isOwner}
            className="w-full bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {tokenList.map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} — {shortAddr(t.address)}
              </option>
            ))}
          </select>
        </div>
        <TxButton
          onClick={handle}
          disabled={!isOwner}
          pending={isPending}
          label="Configure Token"
          pendingLabel="Configuring…"
          variant="blue"
        />
        <TxStatus hash={hash} successMsg="Token configured." />
        <InlineError msg={err} />
      </div>
    </SectionCard>
  )
}

// ─── ConfigureRouteCard ────────────────────────────────────────────────────

function ConfigureRouteCard({
  isOwner,
  agentAddress,
  tokenList,
}: {
  isOwner: boolean
  agentAddress: `0x${string}`
  tokenList: Array<{ address: `0x${string}`; symbol: string; decimals: number }>
}) {
  const [fromToken, setFromToken] = useState(tokenList[0].address)
  const [toToken, setToToken] = useState(tokenList[1]?.address ?? tokenList[0].address)
  const [rateInput, setRateInput] = useState('')
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const [err, setErr] = useState<string | null>(null)

  const { writeContractAsync } = useWriteContract()
  const { isLoading: isPending } = useWaitForTransactionReceipt({ hash })

  // Read current rate for the selected route
  const { data: currentRate } = useReadContract({
    address: agentAddress,
    abi: CLEAR_REBALANCE_AGENT_ABI,
    functionName: 'routeRates',
    args: [fromToken, toToken],
  })

  async function handle() {
    const v = Number(rateInput)
    if (isNaN(v) || v <= 0) return
    setErr(null)
    try {
      const h = await writeContractAsync({
        address: agentAddress,
        abi: CLEAR_REBALANCE_AGENT_ABI,
        functionName: 'configureRoute',
        args: [fromToken, toToken, BigInt(Math.floor(v))],
      })
      setHash(h)
      setRateInput('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('User rejected')) setErr(msg.slice(0, 120))
    }
  }

  const fromSymbol = tokenList.find((t) => t.address === fromToken)?.symbol ?? 'Token'
  const toSymbol = tokenList.find((t) => t.address === toToken)?.symbol ?? 'Token'

  return (
    <SectionCard title="Configure Route">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider">From</label>
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value as `0x${string}`)}
              disabled={!isOwner}
              className="w-full bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              {tokenList.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider">To</label>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value as `0x${string}`)}
              disabled={!isOwner}
              className="w-full bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              {tokenList.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Current rate:{' '}
          <span className="text-white font-mono">
            {currentRate !== undefined && currentRate > 0n
              ? `${currentRate} bps (${(Number(currentRate) / 100).toFixed(2)}%)`
              : 'Not configured'}
          </span>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider">
            Rate (basis points, 10000 = 100%)
          </label>
          <input
            type="number"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            placeholder="e.g. 10000 for 1:1"
            min="1"
            disabled={!isOwner}
            className="w-full bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          {rateInput && !isNaN(Number(rateInput)) && (
            <p className="text-slate-500 text-xs">
              1 {fromSymbol} → {(Number(rateInput) / 10000).toFixed(4)} {toSymbol}
            </p>
          )}
        </div>
        <TxButton
          onClick={handle}
          disabled={!isOwner || !rateInput || Number(rateInput) <= 0}
          pending={isPending}
          label="Set Route Rate"
          pendingLabel="Setting…"
          variant="amber"
        />
        <TxStatus hash={hash} successMsg="Route configured." />
        <InlineError msg={err} />
      </div>
    </SectionCard>
  )
}

// ─── LiquidityCard ─────────────────────────────────────────────────────────

function LiquidityCard({
  isOwner,
  tokenAddresses,
  tokenDetailsData,
  onSuccess,
  agentAddress,
  tokenList,
}: {
  isOwner: boolean
  tokenAddresses: readonly `0x${string}`[]
  tokenDetailsData: any[] | undefined
  onSuccess: () => void
  agentAddress: `0x${string}`
  tokenList: Array<{ address: `0x${string}`; symbol: string; decimals: number }>
}) {
  const { address: userAddress } = useAccount()
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [selectedToken, setSelectedToken] = useState(tokenList[0])
  const [amount, setAmount] = useState('')
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const [err, setErr] = useState<string | null>(null)

  const decimals = selectedToken.decimals

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress!, agentAddress],
    query: { enabled: !!userAddress && mode === 'deposit' },
  })

  const { data: userBalance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress },
  })

  const parsedAmount =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, decimals)
      : 0n

  const needsApproval =
    mode === 'deposit' && parsedAmount > 0n && allowance !== undefined && allowance < parsedAmount

  const { writeContractAsync } = useWriteContract()
  const { isLoading: isApprovalPending } = useWaitForTransactionReceipt({ hash: approvalHash })
  const { isLoading: isTxPending, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) onSuccess()

  async function handleApprove() {
    setErr(null)
    try {
      const h = await writeContractAsync({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [agentAddress, maxUint256],
      })
      setApprovalHash(h)
      await refetchAllowance()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('User rejected')) setErr(msg.slice(0, 120))
    }
  }

  async function handleAction() {
    setErr(null)
    try {
      const fn = mode === 'deposit' ? 'depositLiquidity' : 'withdrawLiquidity'
      const h = await writeContractAsync({
        address: agentAddress,
        abi: CLEAR_REBALANCE_AGENT_ABI,
        functionName: fn,
        args: [selectedToken.address, parsedAmount],
      })
      setHash(h)
      setAmount('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('User rejected')) setErr(msg.slice(0, 120))
    }
  }

  return (
    <SectionCard title="Liquidity Management">
      <div className="space-y-3">
        {/* Deposit / Withdraw toggle */}
        <div className="flex gap-2">
          {(['deposit', 'withdraw'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(null); setHash(undefined) }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                mode === m
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Token selector */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider">Token</label>
          <select
            value={selectedToken.address}
            onChange={(e) => setSelectedToken(tokenList.find((t) => t.address === e.target.value)!)}
            disabled={!isOwner}
            className="w-full bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {tokenList.map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>

        {/* Balance info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/60 rounded-lg p-2">
            <p className="text-slate-400">Your balance</p>
            <p className="text-white font-mono">
              {userBalance !== undefined
                ? fmtTokenAmount(userBalance, decimals)
                : '—'}{' '}
              {selectedToken.symbol}
            </p>
          </div>
        </div>

        {/* Amount input */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider">Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              disabled={!isOwner}
              className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            {mode === 'deposit' && userBalance !== undefined && (
              <button
                onClick={() => setAmount(formatUnits(userBalance, decimals))}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {needsApproval && (
            <TxButton
              onClick={handleApprove}
              disabled={!isOwner}
              pending={isApprovalPending}
              label={`Approve ${selectedToken.symbol}`}
              pendingLabel="Approving…"
              variant="amber"
            />
          )}
          <TxButton
            onClick={handleAction}
            disabled={!isOwner || parsedAmount === 0n || needsApproval || isTxPending}
            pending={isTxPending}
            label={mode === 'deposit' ? 'Deposit' : 'Withdraw'}
            pendingLabel={mode === 'deposit' ? 'Depositing…' : 'Withdrawing…'}
            variant="emerald"
          />
        </div>

        <TxStatus
          hash={hash}
          successMsg={mode === 'deposit' ? 'Liquidity deposited.' : 'Liquidity withdrawn.'}
        />
        <InlineError msg={err} />
      </div>
    </SectionCard>
  )
}

// ─── WhitelistCard ─────────────────────────────────────────────────────────

function WhitelistCard({ isOwner, agentAddress }: { isOwner: boolean; agentAddress: `0x${string}` }) {
  const [checkAddr, setCheckAddr] = useState('')
  const [addAddr, setAddAddr] = useState('')
  const [removeAddr, setRemoveAddr] = useState('')
  const [addHash, setAddHash] = useState<`0x${string}` | undefined>()
  const [removeHash, setRemoveHash] = useState<`0x${string}` | undefined>()
  const [addErr, setAddErr] = useState<string | null>(null)
  const [removeErr, setRemoveErr] = useState<string | null>(null)

  const { writeContractAsync } = useWriteContract()
  const { isLoading: isAddPending } = useWaitForTransactionReceipt({ hash: addHash })
  const { isLoading: isRemovePending } = useWaitForTransactionReceipt({ hash: removeHash })

  const validCheckAddr = isAddress(checkAddr)

  const { data: isWhitelisted } = useReadContract({
    address: agentAddress,
    abi: CLEAR_REBALANCE_AGENT_ABI,
    functionName: 'whitelistedSwappers',
    args: [checkAddr as `0x${string}`],
    query: { enabled: validCheckAddr },
  })

  async function handleAdd() {
    if (!isAddress(addAddr)) return
    setAddErr(null)
    try {
      const h = await writeContractAsync({
        address: agentAddress,
        abi: CLEAR_REBALANCE_AGENT_ABI,
        functionName: 'addSwapperToWhitelist',
        args: [addAddr as `0x${string}`],
      })
      setAddHash(h)
      setAddAddr('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('User rejected')) setAddErr(msg.slice(0, 120))
    }
  }

  async function handleRemove() {
    if (!isAddress(removeAddr)) return
    setRemoveErr(null)
    try {
      const h = await writeContractAsync({
        address: agentAddress,
        abi: CLEAR_REBALANCE_AGENT_ABI,
        functionName: 'removeSwapperFromWhitelist',
        args: [removeAddr as `0x${string}`],
      })
      setRemoveHash(h)
      setRemoveAddr('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('User rejected')) setRemoveErr(msg.slice(0, 120))
    }
  }

  return (
    <SectionCard title="Swapper Whitelist">
      <div className="space-y-4">
        {/* Check status */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider">Check address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={checkAddr}
              onChange={(e) => setCheckAddr(e.target.value)}
              placeholder="0x…"
              className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          {validCheckAddr && isWhitelisted !== undefined && (
            <p className={`text-xs font-medium ${isWhitelisted ? 'text-emerald-400' : 'text-red-400'}`}>
              {isWhitelisted ? '✓ Whitelisted' : '✗ Not whitelisted'}
            </p>
          )}
        </div>

        <div className="border-t border-clear-border pt-4 space-y-3">
          {/* Add */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Add swapper</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={addAddr}
                onChange={(e) => setAddAddr(e.target.value)}
                placeholder="0x…"
                disabled={!isOwner}
                className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <TxButton
                onClick={handleAdd}
                disabled={!isOwner || !isAddress(addAddr)}
                pending={isAddPending}
                label="Add"
                pendingLabel="Adding…"
                variant="emerald"
              />
            </div>
            <TxStatus hash={addHash} successMsg="Swapper added." />
            <InlineError msg={addErr} />
          </div>

          {/* Remove */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Remove swapper</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={removeAddr}
                onChange={(e) => setRemoveAddr(e.target.value)}
                placeholder="0x…"
                disabled={!isOwner}
                className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-red-500 disabled:opacity-50"
              />
              <TxButton
                onClick={handleRemove}
                disabled={!isOwner || !isAddress(removeAddr)}
                pending={isRemovePending}
                label="Remove"
                pendingLabel="Removing…"
                variant="red"
              />
            </div>
            <TxStatus hash={removeHash} successMsg="Swapper removed." />
            <InlineError msg={removeErr} />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
