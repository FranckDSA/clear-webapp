import { GraphQLClient, gql } from 'graphql-request'

export const GRAPHQL_ENDPOINT = 'https://api-arb-sepolia-clear.trevee.xyz/graphql'

export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT)

export interface ClearStatsData {
  id: string
  day: string
  vault?: {
    address: string
    totalAssets: string
    totalSupply: string
    tokens: Array<{
      symbol: string
      address: string
      balance: string
      decimals: string
    }>
  }
  tvlUSD: string
  swapVolumeUSD: string
  swapCount: string
  rebalanceVolumeUSD: string
  rebalanceCount: string
  lpFeesUSD: string
  treasuryFeesUSD: string
}

export interface ClearVaultData {
  id: string
  address: string
  totalAssets: string
  totalSupply: string
  lpFeeBps: string
  treasuryFeeBps: string
  tokens: Array<{
    symbol: string
    address: string
    balance: string
    decimals: string
    maxExposureBps: string
    desiredExposureBps: string
    oracle?: {
      price: string
      oracleDecimals: string
      redemptionPrice: string
    }
  }>
}

// Fetch global stats: both daily (day != 0) and all-time (day == 0)
export const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    clearStats(
      where: { vault_isNull: true }
      orderBy: day_ASC
    ) {
      id
      day
      tvlUSD
      swapVolumeUSD
      swapCount
      rebalanceVolumeUSD
      rebalanceCount
      lpFeesUSD
      treasuryFeesUSD
    }
  }
`

export const GET_VAULT_DAILY_STATS = gql`
  query GetVaultDailyStats {
    clearStats(
      where: { vault_isNull: false, day_not_eq: "0" }
      orderBy: day_ASC
    ) {
      id
      day
      vault {
        address
        totalAssets
        totalSupply
      }
      tvlUSD
      swapVolumeUSD
      swapCount
      rebalanceVolumeUSD
      rebalanceCount
      lpFeesUSD
      treasuryFeesUSD
    }
  }
`

export const GET_VAULTS = gql`
  query GetVaults {
    clearVaults {
      id
      address
      totalAssets
      totalSupply
      lpFeeBps
      treasuryFeeBps
      tokens {
        symbol
        address
        balance
        decimals
        maxExposureBps
        desiredExposureBps
        oracle {
          price
          oracleDecimals
          redemptionPrice
        }
      }
    }
  }
`

export interface ClearRouteResult {
  available: boolean
  unavaibilityReasons: string[]
  receiver: string
  fromToken: string
  toToken: string
  vault: string
  swapContract: string
  amountIn: string
  amountOut?: string
  iouAmountOut?: string
  tx?: {
    to: string
    data: string
    value: string
  }
}

export const CLEAR_ROUTE_QUERY = gql`
  query ClearRoute(
    $receiver: String!
    $fromToken: String!
    $toToken: String!
    $amountIn: String!
    $receiveIOU: Boolean!
  ) {
    clearRoute(
      receiver: $receiver
      fromToken: $fromToken
      toToken: $toToken
      amountIn: $amountIn
      receiveIOU: $receiveIOU
    ) {
      available
      unavaibilityReasons
      receiver
      fromToken
      toToken
      vault
      swapContract
      amountIn
      amountOut
      iouAmountOut
      tx {
        to
        data
        value
      }
    }
  }
`

export interface ClearOraclePriceUpdateData {
  id: string
  price: string
  timestamp: string
}

export interface ClearOracleHistoryData {
  asset: string
  price: string
  lastUpdateTimestamp: string
  priceHistory: ClearOraclePriceUpdateData[]
}

export const GET_ORACLE_HISTORY = gql`
  query GetOraclePriceHistory {
    clearOracles {
      asset
      price
      lastUpdateTimestamp
      priceHistory(orderBy: [timestamp_ASC]) {
        id
        price
        timestamp
      }
    }
  }
`

export interface CurvePoolCoinData {
  index: number
  address: string
  balance: string
  name: string
  symbol: string
  decimals: number
  underlying?: {
    address: string
    name: string
    symbol: string
  }
}

export interface CurvePoolSwapData {
  buyer: string
  soldId: number
  tokensSold: string
  boughtId: number
  tokensBought: string
  isUnderlying: boolean
  timestamp: string
}

export interface CurvePoolData {
  id: string
  name: string
  symbol: string
  decimals: number
  address: string
  poolType: string
  fee: string
  a: string
  virtualPrice: string
  lpTotalSupply: string
  vault: {
    address: string
  }
  token?: {
    address: string
    symbol: string
    iou?: {
      address: string
      symbol: string
    }
  }
  coins: CurvePoolCoinData[]
  swaps: CurvePoolSwapData[]
}

export const GET_CURVE_POOLS = gql`
  query GetCurvePools {
    curvePools(orderBy: poolType_DESC) {
      id
      name
      symbol
      decimals
      address
      poolType
      fee
      a
      virtualPrice
      lpTotalSupply
      vault {
        address
      }
      token {
        address
        symbol
        iou {
          address
          symbol
        }
      }
      coins(orderBy: index_ASC) {
        index
        address
        balance
        name
        symbol
        decimals
        underlying {
          address
          name
          symbol
        }
      }
      swaps(orderBy: timestamp_DESC, limit: 20) {
        buyer
        soldId
        tokensSold
        boughtId
        tokensBought
        isUnderlying
        timestamp
      }
    }
  }
`

// Format a 18-decimal BigInt string as a USD amount
export function formatUSD(value: string | bigint, decimals = 18): string {
  try {
    const n = typeof value === 'bigint' ? value : BigInt(value)
    const divisor = 10n ** BigInt(decimals)
    const whole = n / divisor
    const frac = n % divisor
    const usd = Number(whole) + Number(frac) / Number(divisor)
    if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`
    if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`
    if (usd >= 1e3) return `$${(usd / 1e3).toFixed(2)}K`
    return `$${usd.toFixed(2)}`
  } catch {
    return '$0.00'
  }
}

// Convert a 18-decimal BigInt string to a plain number for charting
export function toUSDNumber(value: string, decimals = 18): number {
  try {
    const n = BigInt(value)
    const divisor = 10n ** BigInt(decimals)
    const whole = n / divisor
    const frac = n % divisor
    return Number(whole) + Number(frac) / Number(divisor)
  } catch {
    return 0
  }
}

// Format a day timestamp (seconds) to a short date label
export function formatDay(day: string): string {
  const ts = Number(day) * 1000
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
