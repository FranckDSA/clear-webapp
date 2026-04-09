import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { formatUnits, parseUnits, maxUint256 } from 'viem'
import {
  CLEAR_VAULT_ABI,
  CLEAR_ORACLE_ABI,
  CLEAR_SWAP_ABI,
  ERC20_ABI,
  getTokenByAddress,
} from '../config/contracts'
import { useChainConfig } from '../hooks/useChainConfig'
import { useExplorer } from '../hooks/useExplorer'
import { useVaultContext } from '../contexts/VaultContext'

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

function TokenRow({ vault, token, oracleAddress, chainId }: { vault: `0x${string}`, token: TokenDetails, oracleAddress: `0x${string}`, chainId: number }) {
  const { getAddressUrl } = useExplorer()
  const tokenInfo = getTokenByAddress(token.addr, chainId)
  const symbol = tokenInfo?.symbol ?? token.addr.slice(0, 8) + '...'
  const decimals = token.decimals ?? 18

  const { data: assets } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'tokenAssets',
    args: [token.addr as `0x${string}`],
  })

  const { data: oracleData } = useReadContract({
    address: oracleAddress,
    abi: CLEAR_ORACLE_ABI,
    functionName: 'getPriceAndRedemptionPrice',
    args: [token.addr as `0x${string}`],
  })

  const isDepegged =
    oracleData !== undefined && Number(oracleData[0]) / 1e8 < 0.9995

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
        <span className={`font-mono ${isDepegged ? 'text-red-400' : 'text-emerald-400'}`}>
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
          <a
            href={getAddressUrl(token.iou)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-purple-400 hover:text-purple-300 hover:underline transition-colors"
          >
            {token.iou.slice(0, 8)}...{token.iou.slice(-6)} ↗
          </a>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        )}
      </td>
    </tr>
  )
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function DepositLiquidityPanel({ vault, tokens, chainId }: { vault: `0x${string}`; tokens: TokenDetails[]; chainId: number }) {
  const { address: userAddress } = useAccount()
  const { getTxUrl } = useExplorer()

  const [selectedToken, setSelectedToken] = useState<TokenDetails | null>(tokens[0] ?? null)
  const [amount, setAmount] = useState('')
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>()
  const [txError, setTxError] = useState<string | null>(null)

  const tokenInfo = selectedToken ? getTokenByAddress(selectedToken.addr, chainId) : null
  const symbol = tokenInfo?.symbol ?? selectedToken?.addr.slice(0, 8) + '...'
  const decimals = selectedToken?.decimals ?? 18

  // User's token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: selectedToken?.addr,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress && !!selectedToken },
  })

  // User's vault share balance
  const { data: shareBalance, refetch: refetchShareBalance } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress },
  })

  // Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken?.addr,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress!, vault],
    query: { enabled: !!userAddress && !!selectedToken },
  })

  const parsedAmount =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, decimals)
      : 0n

  // Preview deposit (shares to receive)
  const { data: previewShares } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'previewDeposit',
    args: [selectedToken?.addr as `0x${string}`, parsedAmount],
    query: { enabled: !!selectedToken && parsedAmount > 0n },
  })

  const { writeContractAsync } = useWriteContract()

  const { isLoading: isApprovalPending, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({ hash: approvalHash })

  const { isLoading: isDepositPending, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash })

  const needsApproval =
    parsedAmount > 0n && allowance !== undefined && allowance < parsedAmount

  async function handleApprove() {
    if (!selectedToken) return
    setTxError(null)
    try {
      const hash = await writeContractAsync({
        address: selectedToken.addr,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [vault, maxUint256],
      })
      setApprovalHash(hash)
      await refetchAllowance()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('User rejected')) setTxError(msg.slice(0, 120))
    }
  }

  async function handleDeposit() {
    if (!userAddress || !selectedToken) return
    setTxError(null)
    try {
      const hash = await writeContractAsync({
        address: vault,
        abi: CLEAR_VAULT_ABI,
        functionName: 'deposit',
        args: [selectedToken.addr, parsedAmount, userAddress],
      })
      setDepositHash(hash)
      setAmount('')
      await refetchBalance()
      await refetchAllowance()
      await refetchShareBalance()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('User rejected')) setTxError(msg.slice(0, 120))
    }
  }

  if (tokens.length === 0) return null

  return (
    <div className="bg-clear-card border border-clear-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-clear-border">
        <h3 className="font-semibold text-white">Deposit Liquidity</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Deposit tokens into the vault to receive vault shares.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {!userAddress && (
          <p className="text-slate-400 text-sm">Connect your wallet to deposit.</p>
        )}

        {userAddress && (
          <>
            {/* Token selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Token</label>
              <div className="flex flex-wrap gap-2">
                {tokens.map((t) => {
                  const info = getTokenByAddress(t.addr, chainId)
                  const sym = info?.symbol ?? t.addr.slice(0, 6)
                  const active = selectedToken?.addr === t.addr
                  return (
                    <button
                      key={t.addr}
                      onClick={() => {
                        setSelectedToken(t)
                        setAmount('')
                        setDepositHash(undefined)
                        setApprovalHash(undefined)
                        setTxError(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {sym}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedToken && (
              <>
                {/* Balances info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">Your Token Balance</p>
                    <p className="text-white font-mono font-medium">
                      {tokenBalance !== undefined
                        ? Number(formatUnits(tokenBalance, decimals)).toLocaleString('en-US', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })
                        : '—'}{' '}
                      <span className="text-blue-400">{symbol}</span>
                    </p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">Your Vault Shares</p>
                    <p className="text-white font-mono font-medium">
                      {shareBalance !== undefined
                        ? Number(formatUnits(shareBalance, 18)).toLocaleString('en-US', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })
                        : '—'}{' '}
                      <span className="text-emerald-400">shares</span>
                    </p>
                  </div>
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Amount to Deposit</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() =>
                        tokenBalance !== undefined &&
                        setAmount(formatUnits(tokenBalance, decimals))
                      }
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  {parsedAmount > 0n && tokenBalance !== undefined && parsedAmount > tokenBalance && (
                    <p className="text-red-400 text-xs">Amount exceeds your balance.</p>
                  )}
                </div>

                {/* Preview */}
                {parsedAmount > 0n && previewShares !== undefined && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-0.5">You will receive</p>
                    <p className="text-emerald-400 font-mono font-medium">
                      {Number(formatUnits(previewShares, 18)).toLocaleString('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6,
                      })}{' '}
                      <span className="text-slate-400">vault shares</span>
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {needsApproval && (
                    <button
                      onClick={handleApprove}
                      disabled={isApprovalPending || !parsedAmount}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {isApprovalPending ? 'Approving…' : `Approve ${symbol}`}
                    </button>
                  )}
                  <button
                    onClick={handleDeposit}
                    disabled={!userAddress || !selectedToken || needsApproval || isDepositPending || parsedAmount === 0n}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isDepositPending ? 'Depositing…' : 'Deposit'}
                  </button>
                </div>

                {/* Status messages */}
                {isApprovalSuccess && approvalHash && !needsApproval && (
                  <p className="text-emerald-400 text-xs">
                    Approval confirmed.{' '}
                    <a href={getTxUrl(approvalHash)} target="_blank" rel="noreferrer" className="underline">
                      View tx
                    </a>
                  </p>
                )}
                {isDepositSuccess && depositHash && (
                  <p className="text-emerald-400 text-xs">
                    Deposit successful.{' '}
                    <a href={getTxUrl(depositHash)} target="_blank" rel="noreferrer" className="underline">
                      View tx
                    </a>
                  </p>
                )}
                {txError && <p className="text-red-400 text-xs break-all">{txError}</p>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function WithdrawLiquidityPanel({ vault, tokens, chainId }: { vault: `0x${string}`; tokens: TokenDetails[]; chainId: number }) {
  const { address: userAddress } = useAccount()
  const { getTxUrl } = useExplorer()

  const [selectedToken, setSelectedToken] = useState<TokenDetails | null>(tokens[0] ?? null)
  const [amount, setAmount] = useState('')
  const [withdrawMode, setWithdrawMode] = useState<'shares' | 'assets'>('shares')
  const [withdrawHash, setWithdrawHash] = useState<`0x${string}` | undefined>()
  const [txError, setTxError] = useState<string | null>(null)

  const tokenInfo = selectedToken ? getTokenByAddress(selectedToken.addr, chainId) : null
  const symbol = tokenInfo?.symbol ?? selectedToken?.addr.slice(0, 8) + '...'
  const decimals = selectedToken?.decimals ?? 18

  // User's vault share balance
  const { data: shareBalance, refetch: refetchShareBalance } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress },
  })

  // Max redeemable shares for this token
  const { data: maxRedeemable } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'maxRedeem',
    args: [selectedToken?.addr as `0x${string}`, userAddress!],
    query: { enabled: !!userAddress && !!selectedToken },
  })

  // Max withdrawable assets for this token
  const { data: maxWithdrawable } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'maxWithdraw',
    args: [selectedToken?.addr as `0x${string}`, userAddress!],
    query: { enabled: !!userAddress && !!selectedToken },
  })

  // Parse amount based on mode (shares use 18 decimals, assets use token decimals)
  const parsedAmount =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, withdrawMode === 'shares' ? 18 : decimals)
      : 0n

  // Preview redeem (assets to receive when specifying shares)
  const { data: previewAssetsFromShares } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'previewRedeem',
    args: [selectedToken?.addr as `0x${string}`, parsedAmount],
    query: { enabled: !!selectedToken && parsedAmount > 0n && withdrawMode === 'shares' },
  })

  // Preview withdraw (shares required when specifying assets)
  const { data: previewSharesFromAssets } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'previewWithdraw',
    args: [selectedToken?.addr as `0x${string}`, parsedAmount],
    query: { enabled: !!selectedToken && parsedAmount > 0n && withdrawMode === 'assets' },
  })

  const { writeContractAsync } = useWriteContract()

  const { isLoading: isWithdrawPending, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash })

  async function handleWithdraw() {
    if (!userAddress || !selectedToken) return
    setTxError(null)
    try {
      let hash: `0x${string}`
      if (withdrawMode === 'shares') {
        // Redeem: specify shares, receive assets
        hash = await writeContractAsync({
          address: vault,
          abi: CLEAR_VAULT_ABI,
          functionName: 'redeem',
          args: [selectedToken.addr, parsedAmount, userAddress, userAddress],
        })
      } else {
        // Withdraw: specify assets, burn required shares
        hash = await writeContractAsync({
          address: vault,
          abi: CLEAR_VAULT_ABI,
          functionName: 'withdraw',
          args: [selectedToken.addr, parsedAmount, userAddress, userAddress],
        })
      }
      setWithdrawHash(hash)
      setAmount('')
      await refetchShareBalance()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('User rejected')) setTxError(msg.slice(0, 120))
    }
  }

  if (tokens.length === 0) return null

  return (
    <div className="bg-clear-card border border-clear-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-clear-border">
        <h3 className="font-semibold text-white">Withdraw Liquidity</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Redeem your vault shares to withdraw tokens.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {!userAddress && (
          <p className="text-slate-400 text-sm">Connect your wallet to withdraw.</p>
        )}

        {userAddress && (
          <>
            {/* Token selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Withdraw Token</label>
              <div className="flex flex-wrap gap-2">
                {tokens.map((t) => {
                  const info = getTokenByAddress(t.addr, chainId)
                  const sym = info?.symbol ?? t.addr.slice(0, 6)
                  const active = selectedToken?.addr === t.addr
                  return (
                    <button
                      key={t.addr}
                      onClick={() => {
                        setSelectedToken(t)
                        setAmount('')
                        setWithdrawHash(undefined)
                        setTxError(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {sym}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedToken && (
              <>
                {/* Balances info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">Your Vault Shares</p>
                    <p className="text-white font-mono font-medium">
                      {shareBalance !== undefined
                        ? Number(formatUnits(shareBalance, 18)).toLocaleString('en-US', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })
                        : '—'}{' '}
                      <span className="text-emerald-400">shares</span>
                    </p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">
                      {withdrawMode === 'shares' ? `Max Redeemable (${symbol})` : `Max Withdrawable (${symbol})`}
                    </p>
                    <p className="text-white font-mono font-medium">
                      {withdrawMode === 'shares' ? (
                        <>
                          {maxRedeemable !== undefined
                            ? Number(formatUnits(maxRedeemable, 18)).toLocaleString('en-US', {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4,
                              })
                            : '—'}{' '}
                          <span className="text-orange-400">shares</span>
                        </>
                      ) : (
                        <>
                          {maxWithdrawable !== undefined
                            ? Number(formatUnits(maxWithdrawable, decimals)).toLocaleString('en-US', {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4,
                              })
                            : '—'}{' '}
                          <span className="text-orange-400">{symbol}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Mode selector */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Specify Amount In</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setWithdrawMode('shares')
                        setAmount('')
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        withdrawMode === 'shares'
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Shares
                    </button>
                    <button
                      onClick={() => {
                        setWithdrawMode('assets')
                        setAmount('')
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        withdrawMode === 'assets'
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {symbol} Amount
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider">
                    {withdrawMode === 'shares' ? 'Shares to Redeem' : `${symbol} to Withdraw`}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={() => {
                        if (withdrawMode === 'shares') {
                          const max = maxRedeemable !== undefined && shareBalance !== undefined
                            ? (maxRedeemable < shareBalance ? maxRedeemable : shareBalance)
                            : 0n
                          setAmount(formatUnits(max, 18))
                        } else {
                          if (maxWithdrawable !== undefined) {
                            setAmount(formatUnits(maxWithdrawable, decimals))
                          }
                        }
                      }}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  {withdrawMode === 'shares' && (
                    <>
                      {parsedAmount > 0n && shareBalance !== undefined && parsedAmount > shareBalance && (
                        <p className="text-red-400 text-xs">Amount exceeds your share balance.</p>
                      )}
                      {parsedAmount > 0n && maxRedeemable !== undefined && parsedAmount > maxRedeemable && (
                        <p className="text-amber-400 text-xs">Amount exceeds max redeemable for this token.</p>
                      )}
                    </>
                  )}
                  {withdrawMode === 'assets' && (
                    <>
                      {parsedAmount > 0n && maxWithdrawable !== undefined && parsedAmount > maxWithdrawable && (
                        <p className="text-amber-400 text-xs">Amount exceeds max withdrawable for this token.</p>
                      )}
                    </>
                  )}
                </div>

                {/* Preview */}
                {parsedAmount > 0n && withdrawMode === 'shares' && previewAssetsFromShares !== undefined && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-0.5">You will receive</p>
                    <p className="text-orange-400 font-mono font-medium">
                      {Number(formatUnits(previewAssetsFromShares, decimals)).toLocaleString('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6,
                      })}{' '}
                      <span className="text-slate-400">{symbol}</span>
                    </p>
                  </div>
                )}
                {parsedAmount > 0n && withdrawMode === 'assets' && previewSharesFromAssets !== undefined && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-0.5">Shares to be burned</p>
                    <p className="text-orange-400 font-mono font-medium">
                      {Number(formatUnits(previewSharesFromAssets, 18)).toLocaleString('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6,
                      })}{' '}
                      <span className="text-slate-400">shares</span>
                    </p>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={handleWithdraw}
                  disabled={!userAddress || !selectedToken || isWithdrawPending || parsedAmount === 0n}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {isWithdrawPending ? 'Withdrawing…' : 'Withdraw'}
                </button>

                {/* Status messages */}
                {isWithdrawSuccess && withdrawHash && (
                  <p className="text-emerald-400 text-xs">
                    Withdrawal successful.{' '}
                    <a href={getTxUrl(withdrawHash)} target="_blank" rel="noreferrer" className="underline">
                      View tx
                    </a>
                  </p>
                )}
                {txError && <p className="text-red-400 text-xs break-all">{txError}</p>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function RedeemIOUPanel({ vault, tokens, clearSwapAddress, chainId }: { vault: `0x${string}`; tokens: TokenDetails[]; clearSwapAddress: `0x${string}`; chainId: number }) {
  const { address: userAddress } = useAccount()
  const { getTxUrl } = useExplorer()

  const redeemableTokens = tokens.filter(
    (t) => t.iou && t.iou !== ZERO_ADDRESS
  )

  const [selectedToken, setSelectedToken] = useState<TokenDetails | null>(
    redeemableTokens[0] ?? null
  )
  const [amount, setAmount] = useState('')
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
  const [redeemHash, setRedeemHash] = useState<`0x${string}` | undefined>()
  const [txError, setTxError] = useState<string | null>(null)

  const tokenInfo = selectedToken
    ? getTokenByAddress(selectedToken.addr, chainId)
    : null
  const symbol = tokenInfo?.symbol ?? selectedToken?.addr.slice(0, 8) + '...'
  const decimals = selectedToken?.decimals ?? 18

  // IOU balance of user
  const { data: iouBalance, refetch: refetchBalance } = useReadContract({
    address: selectedToken?.iou,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    query: { enabled: !!userAddress && !!selectedToken },
  })

  // Allowance of clearSwap over user's IOU tokens
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken?.iou,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress!, clearSwapAddress],
    query: { enabled: !!userAddress && !!selectedToken },
  })

  // Vault must be balanced for redemptions to be open
  const { data: isBalanced } = useReadContract({
    address: vault,
    abi: CLEAR_VAULT_ABI,
    functionName: 'isBalanced',
  })

  const { writeContractAsync } = useWriteContract()

  const { isLoading: isApprovalPending, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({ hash: approvalHash })

  const { isLoading: isRedeemPending, isSuccess: isRedeemSuccess } =
    useWaitForTransactionReceipt({ hash: redeemHash })

  const parsedAmount =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, decimals)
      : 0n

  const needsApproval =
    parsedAmount > 0n && allowance !== undefined && allowance < parsedAmount

  const canRedeem =
    !!userAddress &&
    !!selectedToken &&
    isBalanced === true

  async function handleApprove() {
    if (!selectedToken) return
    setTxError(null)
    try {
      const hash = await writeContractAsync({
        address: selectedToken.iou,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [clearSwapAddress, maxUint256],
      })
      setApprovalHash(hash)
      await refetchAllowance()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('User rejected')) setTxError(msg.slice(0, 120))
    }
  }

  async function handleRedeem() {
    if (!userAddress || !selectedToken) return
    setTxError(null)
    try {
      const hash = await writeContractAsync({
        address: clearSwapAddress,
        abi: CLEAR_SWAP_ABI,
        functionName: 'redeemIOU',
        args: [userAddress, vault, selectedToken.addr, parsedAmount],
      })
      setRedeemHash(hash)
      setAmount('')
      await refetchBalance()
      await refetchAllowance()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('User rejected')) setTxError(msg.slice(0, 120))
    }
  }

  if (redeemableTokens.length === 0) return null

  return (
    <div className="bg-clear-card border border-clear-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-clear-border flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">Redeem IOU</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Redeem your IOU tokens for the underlying asset via the ClearSwap contract.
          </p>
        </div>
        {isBalanced === undefined ? (
          <span className="text-xs text-slate-500 mt-0.5">—</span>
        ) : isBalanced ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Redemptions open
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Redemptions closed
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {!userAddress && (
          <p className="text-slate-400 text-sm">Connect your wallet to redeem IOU tokens.</p>
        )}

        {userAddress && (
          <>
            {/* Token selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider">IOU Token</label>
              <div className="flex flex-wrap gap-2">
                {redeemableTokens.map((t) => {
                  const info = getTokenByAddress(t.addr, chainId)
                  const sym = info?.symbol ?? t.addr.slice(0, 6)
                  const active = selectedToken?.addr === t.addr
                  return (
                    <button
                      key={t.addr}
                      onClick={() => {
                        setSelectedToken(t)
                        setAmount('')
                        setRedeemHash(undefined)
                        setApprovalHash(undefined)
                        setTxError(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {sym} IOU
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedToken && (
              <>
                {/* IOU info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">Your IOU Balance</p>
                    <p className="text-white font-mono font-medium">
                      {iouBalance !== undefined
                        ? Number(formatUnits(iouBalance, decimals)).toLocaleString('en-US', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })
                        : '—'}{' '}
                      <span className="text-purple-400">{symbol} IOU</span>
                    </p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">Total Emitted (vault)</p>
                    <p className="text-white font-mono font-medium">
                      {Number(formatUnits(selectedToken.emitedIou, decimals)).toLocaleString(
                        'en-US',
                        { minimumFractionDigits: 4, maximumFractionDigits: 4 }
                      )}{' '}
                      <span className="text-purple-400">{symbol} IOU</span>
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
                      className="flex-1 bg-slate-800 border border-clear-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() =>
                        iouBalance !== undefined &&
                        setAmount(formatUnits(iouBalance, decimals))
                      }
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  {parsedAmount > 0n && iouBalance !== undefined && parsedAmount > iouBalance && (
                    <p className="text-red-400 text-xs">Amount exceeds your IOU balance.</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {needsApproval && (
                    <button
                      onClick={handleApprove}
                      disabled={isApprovalPending || !parsedAmount}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {isApprovalPending ? 'Approving…' : `Approve ${symbol} IOU`}
                    </button>
                  )}
                  <button
                    onClick={handleRedeem}
                    disabled={!canRedeem || isRedeemPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isRedeemPending ? 'Redeeming…' : 'Redeem IOU'}
                  </button>
                </div>

                {isBalanced === false && (
                  <p className="text-amber-400 text-xs">
                    The vault is currently unbalanced — redemptions are unavailable until it rebalances.
                  </p>
                )}

                {/* Status messages */}
                {isApprovalSuccess && approvalHash && !needsApproval && (
                  <p className="text-emerald-400 text-xs">
                    Approval confirmed.{' '}
                    <a
                      href={getTxUrl(approvalHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      View tx
                    </a>
                  </p>
                )}
                {isRedeemSuccess && redeemHash && (
                  <p className="text-emerald-400 text-xs">
                    IOU redeemed successfully.{' '}
                    <a
                      href={getTxUrl(redeemHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      View tx
                    </a>
                  </p>
                )}
                {txError && (
                  <p className="text-red-400 text-xs break-all">{txError}</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function VaultDetails() {
  const chainId = useChainId()
  const { addresses } = useChainConfig()
  const { selectedVaultAddress, vaults } = useVaultContext()

  // Use selected vault from context, fallback to default
  const vaultAddress = (selectedVaultAddress as `0x${string}`) || addresses.defaultVault

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
    address: addresses.clearFactory,
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
            {vaults.length > 0 && ` — Viewing vault ${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}`}
          </p>
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
                      oracleAddress={addresses.clearOracle}
                      chainId={chainId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deposit & Withdraw Liquidity */}
          {tokens && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DepositLiquidityPanel vault={vaultAddress} tokens={[...tokens]} chainId={chainId} />
              <WithdrawLiquidityPanel vault={vaultAddress} tokens={[...tokens]} chainId={chainId} />
            </div>
          )}

          {/* Redeem IOU */}
          {tokens && (
            <RedeemIOUPanel vault={vaultAddress} tokens={[...tokens]} clearSwapAddress={addresses.clearSwap} chainId={chainId} />
          )}
        </>
      )}
    </div>
  )
}
