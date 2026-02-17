import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  graphqlClient,
  GET_GLOBAL_STATS,
  GET_VAULT_DAILY_STATS,
  GET_VAULTS,
  ClearStatsData,
  ClearVaultData,
  formatUSD,
  toUSDNumber,
  formatDay,
} from '../lib/graphql'

interface GlobalStatsResponse {
  clearStats: ClearStatsData[]
}

interface VaultDailyStatsResponse {
  clearStats: ClearStatsData[]
}

interface VaultsResponse {
  clearVaults: ClearVaultData[]
}

function useGlobalStats() {
  return useQuery({
    queryKey: ['globalStats'],
    queryFn: () => graphqlClient.request<GlobalStatsResponse>(GET_GLOBAL_STATS).then(d => d.clearStats),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

function useVaultDailyStats() {
  return useQuery({
    queryKey: ['vaultDailyStats'],
    queryFn: () => graphqlClient.request<VaultDailyStatsResponse>(GET_VAULT_DAILY_STATS).then(d => d.clearStats),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

function useVaults() {
  return useQuery({
    queryKey: ['vaults'],
    queryFn: () => graphqlClient.request<VaultsResponse>(GET_VAULTS).then(d => d.clearVaults),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-clear-card border border-clear-border rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="text-white font-mono">{formatUSD(String(Math.round(entry.value * 1e18)))}</span>
        </div>
      ))}
    </div>
  )
}

function VolumeTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-clear-card border border-clear-border rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="text-white font-mono">{formatUSD(String(Math.round(entry.value * 1e18)))}</span>
        </div>
      ))}
    </div>
  )
}

const DONUT_COLORS = ['#1a56db', '#7c3aed', '#059669', '#f59e0b', '#f97316', '#0284c7']

function DonutTooltip({ active, payload, totalUSD }: { active?: boolean; payload?: any[]; totalUSD: number }) {
  if (!active || !payload || !payload.length) return null
  const entry = payload[0].payload
  const pct = totalUSD > 0 ? ((entry.value / totalUSD) * 100).toFixed(1) : '0'
  const formatted = entry.value >= 1e6
    ? `$${(entry.value / 1e6).toFixed(2)}M`
    : entry.value >= 1e3
    ? `$${(entry.value / 1e3).toFixed(2)}K`
    : `$${entry.value.toFixed(2)}`
  return (
    <div className="bg-clear-card border border-clear-border rounded-lg p-3 shadow-xl text-xs">
      <p className="text-white font-semibold">{entry.symbol}</p>
      <p className="text-slate-300 mt-1">{formatted}</p>
      <p className="text-slate-400">{pct}% of vault</p>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-clear-card border border-clear-border rounded-xl p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-clear-card border border-clear-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-clear-card border border-clear-border rounded-xl p-5 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-clear-card border border-clear-border rounded-xl p-5 h-64" />
        ))}
      </div>
    </div>
  )
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function bpsToPercent(bps: string) {
  return (Number(bps) / 100).toFixed(2) + '%'
}

function tokenBalance(balance: string, decimals: string): string {
  try {
    const dec = Number(decimals)
    const val = Number(BigInt(balance)) / 10 ** dec
    if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M'
    if (val >= 1e3) return (val / 1e3).toFixed(2) + 'K'
    return val.toFixed(2)
  } catch {
    return '0'
  }
}

export function Stats() {
  const { data: globalStats, isLoading: globalLoading, error: globalError } = useGlobalStats()
  const { data: vaultDailyStats, isLoading: vaultLoading } = useVaultDailyStats()
  const { data: vaults, isLoading: vaultsLoading } = useVaults()

  const isLoading = globalLoading || vaultLoading || vaultsLoading

  if (isLoading) return <LoadingSkeleton />

  if (globalError) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400 font-semibold">Failed to load protocol stats</p>
        <p className="text-slate-400 text-sm mt-1">Could not reach the indexer API</p>
      </div>
    )
  }

  // Separate alltime (day=0) from daily stats
  const allTimeGlobal = globalStats?.find(s => s.day === '0')
  const dailyGlobal = (globalStats ?? [])
    .filter(s => s.day !== '0')
    .slice(-30) // last 30 days

  // Current TVL from latest daily entry (or alltime if no daily)
  const latestDaily = dailyGlobal[dailyGlobal.length - 1]
  const currentTvl = latestDaily?.tvlUSD ?? allTimeGlobal?.tvlUSD ?? '0'

  // TVL chart data
  const tvlData = dailyGlobal.map(s => ({
    date: formatDay(s.day),
    tvl: toUSDNumber(s.tvlUSD),
  }))

  // Volume chart data
  const volumeData = dailyGlobal.map(s => ({
    date: formatDay(s.day),
    swap: toUSDNumber(s.swapVolumeUSD),
    rebalance: toUSDNumber(s.rebalanceVolumeUSD),
  }))

  // Fees chart data
  const feesData = dailyGlobal.map(s => ({
    date: formatDay(s.day),
    lp: toUSDNumber(s.lpFeesUSD),
    treasury: toUSDNumber(s.treasuryFeesUSD),
  }))

  // Per-vault activity: group vault daily stats by vault address
  const vaultStatsByAddress = new Map<string, ClearStatsData[]>()
  for (const s of vaultDailyStats ?? []) {
    if (!s.vault) continue
    const addr = s.vault.address
    if (!vaultStatsByAddress.has(addr)) vaultStatsByAddress.set(addr, [])
    vaultStatsByAddress.get(addr)!.push(s)
  }

  return (
    <div className="space-y-6">
      {/* Section title */}
      <div>
        <h2 className="text-2xl font-bold text-white">Protocol Overview</h2>
        <p className="text-slate-400 text-sm mt-1">Live stats from the Clear Protocol indexer</p>
      </div>

      {/* Global KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Value Locked"
          value={formatUSD(currentTvl)}
          sub="Current TVL across all vaults"
        />
        <StatCard
          label="Total Swap Volume"
          value={formatUSD(allTimeGlobal?.swapVolumeUSD ?? '0')}
          sub={`${allTimeGlobal?.swapCount ?? 0} swaps`}
        />
        <StatCard
          label="Total Fees Collected"
          value={formatUSD(
            String(
              BigInt(allTimeGlobal?.lpFeesUSD ?? '0') +
              BigInt(allTimeGlobal?.treasuryFeesUSD ?? '0')
            )
          )}
          sub="LP + treasury fees"
        />
        <StatCard
          label="Rebalance Volume"
          value={formatUSD(allTimeGlobal?.rebalanceVolumeUSD ?? '0')}
          sub={`${allTimeGlobal?.rebalanceCount ?? 0} rebalances`}
        />
      </div>

      {/* Charts — TVL + Volume side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="TVL Over Time (30 days)">
          {tvlData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tvlData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a56db" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0)}`}
                  width={60}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  name="TVL"
                  stroke="#1a56db"
                  strokeWidth={2}
                  fill="url(#tvlGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Daily Swap Volume (30 days)">
          {volumeData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toFixed(0)}`}
                  width={60}
                />
                <Tooltip content={<VolumeTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="swap" name="Swap" stackId="vol" fill="#1a56db" radius={[0, 0, 0, 0]} />
                <Bar dataKey="rebalance" name="Rebalance" stackId="vol" fill="#7c3aed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Daily Fees (30 days)">
          {feesData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={feesData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(2)}`}
                  width={60}
                />
                <Tooltip content={<VolumeTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="lp" name="LP Fees" stackId="fees" fill="#059669" radius={[0, 0, 0, 0]} />
                <Bar dataKey="treasury" name="Treasury Fees" stackId="fees" fill="#0284c7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Daily Swap Count (30 days)">
          {dailyGlobal.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={dailyGlobal.map(s => ({ date: formatDay(s.day), swaps: Number(s.swapCount), rebalances: Number(s.rebalanceCount) }))}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="swaps" name="Swaps" stackId="cnt" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="rebalances" name="Rebalances" stackId="cnt" fill="#f97316" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Per-vault section */}
      {(vaults ?? []).length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Vaults</h3>
          <div className="space-y-4">
            {(vaults ?? []).map(vault => {
              const vaultStats = vaultStatsByAddress.get(vault.address) ?? []
              const latestVaultStat = vaultStats[vaultStats.length - 1]
              const donutData = vault.tokens
                .map(token => {
                  const dec = Number(token.decimals)
                  const balance = Number(BigInt(token.balance)) / 10 ** dec
                  const price = token.oracle
                    ? Number(BigInt(token.oracle.price)) / 10 ** Number(token.oracle.oracleDecimals)
                    : 1
                  return { symbol: token.symbol, value: balance * price }
                })
                .filter(d => d.value > 0)
              const totalUSD = donutData.reduce((sum, d) => sum + d.value, 0)

              return (
                <div key={vault.id} className="bg-clear-card border border-clear-border rounded-xl p-5">
                  {/* Vault header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">Vault</span>
                        <a
                          href={`https://sepolia.arbiscan.io/address/${vault.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 text-xs font-mono hover:text-blue-300 transition-colors"
                        >
                          {shortAddress(vault.address)} ↗
                        </a>
                      </div>
                      <p className="text-white font-bold mt-0.5">
                        TVL: {latestVaultStat ? formatUSD(latestVaultStat.tvlUSD) : formatUSD(vault.totalAssets)}
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <p className="text-slate-400">LP Fee</p>
                        <p className="text-white font-mono">{bpsToPercent(vault.lpFeeBps)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Treasury Fee</p>
                        <p className="text-white font-mono">{bpsToPercent(vault.treasuryFeeBps)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total Swaps</p>
                        <p className="text-white font-mono">
                          {vaultStats.reduce((sum, s) => sum + Number(s.swapCount), 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Volume</p>
                        <p className="text-white font-mono">
                          {formatUSD(String(vaultStats.reduce((sum, s) => sum + BigInt(s.swapVolumeUSD), 0n)))}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Asset proportions donut */}
                    <div>
                      <p className="text-xs text-slate-400 mb-3">Asset Proportions</p>
                      {donutData.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4">No asset data</p>
                      ) : (
                        <div className="flex items-center gap-3">
                          <PieChart width={160} height={160}>
                            <Pie
                              data={donutData}
                              cx={75}
                              cy={75}
                              innerRadius={48}
                              outerRadius={72}
                              paddingAngle={2}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              {donutData.map((_, i) => (
                                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<DonutTooltip totalUSD={totalUSD} />} />
                          </PieChart>
                          <div className="flex-1 space-y-2">
                            {donutData.map((d, i) => (
                              <div key={d.symbol} className="flex items-center gap-1.5 text-xs">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                />
                                <span className="text-slate-300">{d.symbol}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Token composition */}
                    <div>
                      <p className="text-xs text-slate-400 mb-3">Token Composition</p>
                      {vault.tokens.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4">No tokens</p>
                      ) : (
                        <div className="space-y-2">
                          {vault.tokens.map(token => {
                            const oraclePrice = token.oracle
                              ? Number(BigInt(token.oracle.price)) / 10 ** Number(token.oracle.oracleDecimals)
                              : null
                            const isDepegged = oraclePrice !== null && oraclePrice < 0.9995
                            const currentBps = vault.tokens.length > 0
                              ? Number(token.maxExposureBps)
                              : 10000
                            return (
                              <div key={token.address} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-slate-300">
                                      {token.symbol.slice(0, 1)}
                                    </span>
                                  </div>
                                  <span className="text-white text-sm font-semibold">{token.symbol}</span>
                                  {isDepegged && (
                                    <span className="text-xs bg-red-900/40 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
                                      depegged
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                                  <div className="text-right">
                                    <p className="text-slate-400">Balance</p>
                                    <p className="text-white font-mono">{tokenBalance(token.balance, token.decimals)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-slate-400">Target</p>
                                    <p className="text-white font-mono">{bpsToPercent(token.desiredExposureBps)}</p>
                                  </div>
                                  <div className="text-right hidden sm:block">
                                    <p className="text-slate-400">Max</p>
                                    <p className="text-slate-300 font-mono">{bpsToPercent(String(currentBps))}</p>
                                  </div>
                                  {oraclePrice !== null && (
                                    <div className="text-right">
                                      <p className="text-slate-400">Price</p>
                                      <p className={`font-mono ${isDepegged ? 'text-red-400' : 'text-emerald-400'}`}>
                                        ${oraclePrice.toFixed(4)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
