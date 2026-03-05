import { type Address } from 'viem'
import { mainnet, arbitrumSepolia } from 'wagmi/chains'

// ─── Chain-specific Configuration ─────────────────────────────────────────

export type ChainConfig = {
  addresses: {
    clearFactory: Address
    clearOracle: Address
    clearSwap: Address
    clearAccessManager: Address
    defaultVault: Address
    clearRebalanceAgent: Address | null
  }
  tokens: Record<string, { address: Address; symbol: string; decimals: number }>
}

// Ethereum Mainnet (chain 1)
const MAINNET_CONFIG: ChainConfig = {
  addresses: {
    clearFactory: '0x78aba0729345219B8Ec4D5c9c19D23186E0803fB',
    clearOracle: '0xFb31c9Fe8d2D02AC04379ab2Cc6e840ede2e613C',
    clearSwap: '0x35e22BcC2c60c8a721cb36cE47ad562860A2D9CB',
    clearAccessManager: '0x02792c6E39A4F338283e9B6152e2182F9E2153b3',
    defaultVault: '0xc4E625Bc9B15F568b2685922fb8e46a7522c4910', // TODO: Update with actual vault
    clearRebalanceAgent: '0xfd86FAEF607A67ED68F7C29042E022196f21DE10',
  },
  tokens: {
    GHO: {
      address: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
      symbol: 'GHO',
      decimals: 18,
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
    },
    USDe: {
      address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
      symbol: 'USDe',
      decimals: 18,
    },
    USDS: {
      address: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      symbol: 'USDS',
      decimals: 18,
    },
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      decimals: 6,
    },
  },
}

// Arbitrum Sepolia (chain 421614)
const ARBITRUM_SEPOLIA_CONFIG: ChainConfig = {
  addresses: {
    clearFactory: '0x9e422482f0ffC1f0b98f94db79bC771B184fD71A',
    clearOracle: '0x11e51A3194dA1649EF5A6cfF7EF2b8B29B095915',
    clearSwap: '0xC305c7717fD3B5aa5375BF5780B80B10C2Ec4F6d',
    clearAccessManager: '0x665a87D3FE39e2B5Aa8667747E23871d124D3785',
    defaultVault: '0x02912591442Beb7Fd824Df4c90006093371898EF',
    clearRebalanceAgent: '0x615486797034Cf4bd6cC56F8cfd530A02c5ac35e',
  },
  tokens: {
    GHO: {
      address: '0x7908e48e21c4917553a4e7d94Cb18F0c202E30a7',
      symbol: 'GHO',
      decimals: 18,
    },
    USDC: {
      address: '0xE9e3753c394Be0B92A38E2d616E3dA1EF97F9F56',
      symbol: 'USDC',
      decimals: 6,
    },
    USDe: {
      address: '0xd344d6E2db6DBa751e0Ec8bF7e12176F0e27e314',
      symbol: 'USDe',
      decimals: 18,
    },
    USDS: {
      address: '0xe55cAEC8C17E75Ef2fa3E0BbE7470d7965d23619',
      symbol: 'USDS',
      decimals: 18,
    },
    USDT: {
      address: '0xec5e1fdcE04f21a84b453217B89fe111BC93CFDf',
      symbol: 'USDT',
      decimals: 6,
    },
  },
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [mainnet.id]: MAINNET_CONFIG,
  [arbitrumSepolia.id]: ARBITRUM_SEPOLIA_CONFIG,
}

// Helper function to get configuration for a chain
export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAIN_CONFIGS[chainId]
  if (!config) {
    // Default to Arbitrum Sepolia if chain not found
    return ARBITRUM_SEPOLIA_CONFIG
  }
  return config
}

// Backwards compatibility - default to Arbitrum Sepolia
export const ADDRESSES = ARBITRUM_SEPOLIA_CONFIG.addresses
export const TOKENS = ARBITRUM_SEPOLIA_CONFIG.tokens

export const TOKEN_BY_ADDRESS: Record<string, { address: Address; symbol: string; decimals: number }> =
  Object.fromEntries(
    Object.values(TOKENS).map((t) => [t.address.toLowerCase(), t])
  )

// Helper function to get token by address for a specific chain
export function getTokenByAddress(address: string, chainId: number): { address: Address; symbol: string; decimals: number } | undefined {
  const config = getChainConfig(chainId)
  const tokenByAddress: Record<string, { address: Address; symbol: string; decimals: number }> = Object.fromEntries(
    Object.values(config.tokens).map((t) => [t.address.toLowerCase(), t])
  )
  return tokenByAddress[address.toLowerCase()]
}

// ─── ABIs ──────────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const CLEAR_VAULT_ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"address","name":"authority","type":"address"}],"name":"AccessManagedInvalidAuthority","type":"error"},
  {"inputs":[{"internalType":"address","name":"caller","type":"address"},{"internalType":"uint32","name":"delay","type":"uint32"}],"name":"AccessManagedRequiredDelay","type":"error"},
  {"inputs":[{"internalType":"address","name":"caller","type":"address"}],"name":"AccessManagedUnauthorized","type":"error"},
  {"inputs":[],"name":"BadAdapterConfiguration","type":"error"},
  {"inputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"uint256","name":"max","type":"uint256"}],"name":"ClearVaultExceededMaxDeposit","type":"error"},
  {"inputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"max","type":"uint256"}],"name":"ClearVaultExceededMaxMint","type":"error"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"max","type":"uint256"}],"name":"ClearVaultExceededMaxRedeem","type":"error"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"uint256","name":"max","type":"uint256"}],"name":"ClearVaultExceededMaxWithdraw","type":"error"},
  {"inputs":[],"name":"CurvePoolNotSet","type":"error"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},
  {"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},
  {"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},
  {"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},
  {"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},
  {"inputs":[],"name":"InvalidAmount","type":"error"},
  {"inputs":[],"name":"InvalidInitialization","type":"error"},
  {"inputs":[],"name":"InvalidInput","type":"error"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint8","name":"decimals","type":"uint8"}],"name":"InvalidTokenDecimals","type":"error"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"NoTokenDecimals","type":"error"},
  {"inputs":[],"name":"NotInitializing","type":"error"},
  {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"RebalanceSpreadTooHigh","type":"error"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},
  {"inputs":[],"name":"SwapExceedMaximalExposure","type":"error"},
  {"inputs":[],"name":"TokenAlreadyInitialized","type":"error"},
  {"inputs":[],"name":"UnknownRebalanceSwapError","type":"error"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"UnknownToken","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"newAdapter","type":"address"}],"name":"AdapterChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"authority","type":"address"}],"name":"AuthorityUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ClearIOUWrapped","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newSpread","type":"uint256"}],"name":"DesiredExposureMaximalBpsSpreadUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"pool","type":"address"}],"name":"IouCurveMetaPoolUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"lpFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"treasuryFee","type":"uint256"}],"name":"IouFeeBpsUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountIn","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"LiquidityRebalanceExecuted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountIn","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenAmountOut","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"iouAmountOut","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"iouTreasuryFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"iouLpFee","type":"uint256"}],"name":"LiquiditySwapExecuted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newSpread","type":"uint256"}],"name":"MaximalRebalanceBpsSpreadUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"}],"name":"TokenAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"newDesiredExposureBps","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newMaximalExposureBps","type":"uint256"}],"name":"TokenExposureConfigurationUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"iouCurveMetaPool","type":"address"},{"indexed":false,"internalType":"address","name":"iou","type":"address"},{"indexed":false,"internalType":"address","name":"adapter","type":"address"},{"indexed":false,"internalType":"uint256","name":"desiredExposureBps","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"maxExposureBps","type":"uint256"}],"name":"TokenInitialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_initialAuthority","type":"address"},{"indexed":false,"internalType":"string","name":"_name","type":"string"},{"indexed":false,"internalType":"string","name":"_symbol","type":"string"},{"indexed":false,"internalType":"address","name":"_tokensCurvePool","type":"address"},{"indexed":false,"internalType":"address[]","name":"_tokens","type":"address[]"}],"name":"VaultInitialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Withdraw","type":"event"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"authority","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_newAdapter","type":"address"}],"name":"changeAdapter","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"convertToAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"convertToShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"pure","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"desiredExposureMaximalBpsSpread","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"details","outputs":[{"internalType":"uint256","name":"vaultIouTreasuryFeeBps","type":"uint256"},{"internalType":"uint256","name":"vaultIouLpFeeBps","type":"uint256"},{"internalType":"uint256","name":"vaultMaximumRebalanceBpsSpread","type":"uint256"},{"internalType":"uint256","name":"vaultDesiredExposureMaximalBpsSpread","type":"uint256"},{"internalType":"uint256","name":"vaultTotalAssets","type":"uint256"},{"components":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"address","name":"iou","type":"address"},{"internalType":"address","name":"iouCurveMetaPool","type":"address"},{"internalType":"address","name":"adapter","type":"address"},{"internalType":"uint256","name":"maxExposureBps","type":"uint256"},{"internalType":"uint256","name":"desiredExposureBps","type":"uint256"},{"internalType":"uint256","name":"emitedIou","type":"uint256"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"exposure","type":"uint256"},{"internalType":"uint8","name":"decimals","type":"uint8"}],"internalType":"struct IClearVault.TokenDetails[]","name":"vaultTokens","type":"tuple[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"exposureConfigurationOf","outputs":[{"internalType":"uint256","name":"desiredExposureBps","type":"uint256"},{"internalType":"uint256","name":"maxExposureBps","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"exposureOf","outputs":[{"internalType":"uint256","name":"exposure","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"index","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_initialAuthority","type":"address"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"address","name":"_tokensCurvePool","type":"address"},{"internalType":"address[]","name":"_tokens","type":"address[]"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_iou","type":"address"},{"internalType":"address","name":"_iouCurveMetaPool","type":"address"},{"internalType":"address","name":"_adapter","type":"address"},{"internalType":"uint256","name":"_desiredExposureBps","type":"uint256"},{"internalType":"uint256","name":"_maxExposureBps","type":"uint256"}],"name":"initializeToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"iouCurveMetaPoolOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"iouFeeBps","outputs":[{"internalType":"uint256","name":"lpFee","type":"uint256"},{"internalType":"uint256","name":"treasuryFee","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"iouOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"isBalanced","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"isConsumingScheduledOp","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"maxDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"maxMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"maxRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"maxWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"maximumRebalanceBpsSpread","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"address","name":"_approval","type":"address"},{"internalType":"address","name":"_target","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes","name":"_payload","type":"bytes"}],"name":"rebalance","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"redeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_sender","type":"address"},{"internalType":"address","name":"_receiver","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"redeemIOU","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newAuthority","type":"address"}],"name":"setAuthority","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_newDesiredExposureMaximalBpsSpread","type":"uint256"}],"name":"setDesiredExposureMaximalBpsSpread","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_lpFee","type":"uint256"},{"internalType":"uint256","name":"_treasuryFee","type":"uint256"}],"name":"setIouFeeBps","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_newMaximumRebalanceBpsSpread","type":"uint256"}],"name":"setMaximumRebalanceBpsSpread","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_newDesiredExposureBps","type":"uint256"},{"internalType":"uint256","name":"_newMaximalExposureBps","type":"uint256"}],"name":"setTokenExposureConfiguration","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_receiver","type":"address"},{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_amountIn","type":"uint256"},{"internalType":"uint256","name":"_amountOut","type":"uint256"},{"internalType":"uint256","name":"_amountIou","type":"uint256"}],"name":"swapLiquidity","outputs":[{"internalType":"uint256","name":"iousReceived","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"tokenAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"tokenCurveMetaPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"tokens","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"tokensCurvePool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"tokensCurvePoolIndexOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"_tassets","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_receiver","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"wrapIOU","outputs":[],"stateMutability":"nonpayable","type":"function"}
] as const

export const CLEAR_SWAP_ABI = [
  {
    inputs: [
      { name: 'vault', type: 'address' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'receiveIOU', type: 'bool' },
    ],
    name: 'previewSwap',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'ious', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'vault', type: 'address' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'receiveIOU', type: 'bool' },
    ],
    name: 'swap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'depegThresholdBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maximalDepegThresholdBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'vault', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'redeemIOU',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const CLEAR_ORACLE_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "authority",
          "type": "address"
        }
      ],
      "name": "AccessManagedInvalidAuthority",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "caller",
          "type": "address"
        },
        {
          "internalType": "uint32",
          "name": "delay",
          "type": "uint32"
        }
      ],
      "name": "AccessManagedRequiredDelay",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "caller",
          "type": "address"
        }
      ],
      "name": "AccessManagedUnauthorized",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "BadInputsLength",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidInitialization",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidTTL",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInitializing",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "asset",
          "type": "address"
        }
      ],
      "name": "OracleNotEnabled",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "asset",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "lastUpdate",
          "type": "uint256"
        }
      ],
      "name": "OraclePriceOutdated",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SequencerDown",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SequencerGracePeriodNotOver",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "authority",
          "type": "address"
        }
      ],
      "name": "AuthorityUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "asset",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "ClearOracleRateChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "sequencer",
          "type": "address"
        }
      ],
      "name": "ClearOracleSequencerCheckEnabled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "version",
          "type": "uint64"
        }
      ],
      "name": "Initialized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bool",
          "name": "enabled",
          "type": "bool"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "asset",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "assetDecimals",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "oracleDecimals",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "priceTTL",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "redemptionPrice",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum IClearOracle.ClearOracleAdaptersType",
          "name": "adapterType",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "adapter",
          "type": "address"
        }
      ],
      "name": "OracleConfigured",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "authority",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_assets",
          "type": "address[]"
        },
        {
          "internalType": "bytes[]",
          "name": "_oracleConfigs",
          "type": "bytes[]"
        }
      ],
      "name": "batchConfigureOracle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "_enabled",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "_asset",
          "type": "address"
        },
        {
          "internalType": "uint8",
          "name": "_assetDecimals",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "_oracleDecimals",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "_redemptionPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_priceTTL",
          "type": "uint256"
        },
        {
          "internalType": "enum IClearOracle.ClearOracleAdaptersType",
          "name": "_adapterType",
          "type": "uint8"
        },
        {
          "internalType": "address",
          "name": "_adapter",
          "type": "address"
        }
      ],
      "name": "configureOracle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_asset",
          "type": "address"
        }
      ],
      "name": "getPriceAndRedemptionPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "redemptionPrice",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "getPricesAndRate",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "fromPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "toPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "rate",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "getRate",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "getSwapData",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "fromPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "toPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "fromRedemptionPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "fromPriceDecimals",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "toPriceDecimals",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "amountOut",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_asset",
          "type": "address"
        }
      ],
      "name": "getUSDPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_initialAuthority",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "_sequencerEnabled",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "_sequencerUptimeFeed",
          "type": "address"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "isConsumingScheduledOp",
      "outputs": [
        {
          "internalType": "bytes4",
          "name": "",
          "type": "bytes4"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_asset",
          "type": "address"
        }
      ],
      "name": "oracleConfiguration",
      "outputs": [
        {
          "internalType": "bool",
          "name": "enabled",
          "type": "bool"
        },
        {
          "internalType": "uint8",
          "name": "assetDecimals",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "oracleDecimals",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "redemptionPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "priceTTL",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastUpdateTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "enum IClearOracle.ClearOracleAdaptersType",
          "name": "adapterType",
          "type": "uint8"
        },
        {
          "internalType": "address",
          "name": "adapter",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newAuthority",
          "type": "address"
        }
      ],
      "name": "setAuthority",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_asset",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_price",
          "type": "uint256"
        }
      ],
      "name": "updateCustomOraclePrice",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_assets",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "_prices",
          "type": "uint256[]"
        }
      ],
      "name": "updateCustomOraclePrices",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const

// Curve StableSwap pool ABI (shared functions for both base and meta pools)
export const CURVE_POOL_ABI = [
  {
    name: 'exchange',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'i', type: 'int128' },
      { name: 'j', type: 'int128' },
      { name: 'dx', type: 'uint256' },
      { name: 'min_dy', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'exchange_underlying',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'i', type: 'int128' },
      { name: 'j', type: 'int128' },
      { name: 'dx', type: 'uint256' },
      { name: 'min_dy', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'get_dy',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'i', type: 'int128' },
      { name: 'j', type: 'int128' },
      { name: 'dx', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'get_dy_underlying',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'i', type: 'int128' },
      { name: 'j', type: 'int128' },
      { name: 'dx', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'remove_liquidity_one_coin',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token_amount', type: 'uint256' },
      { name: 'i', type: 'int128' },
      { name: 'min_amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'calc_withdraw_one_coin',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token_amount', type: 'uint256' },
      { name: 'i', type: 'int128' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'lp_token',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'token',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'balances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'i', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'get_virtual_price',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'fee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'A',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// 2-coin Curve pool add_liquidity (for meta pools)
export const CURVE_POOL_2COIN_ABI = [
  {
    name: 'add_liquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amounts', type: 'uint256[2]' },
      { name: 'min_mint_amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'calc_token_amount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amounts', type: 'uint256[2]' },
      { name: 'is_deposit', type: 'bool' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'remove_liquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'min_amounts', type: 'uint256[2]' },
    ],
    outputs: [{ name: '', type: 'uint256[2]' }],
  },
] as const

// 5-coin Curve pool add_liquidity (for base pool)
export const CURVE_POOL_5COIN_ABI = [
  {
    name: 'add_liquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amounts', type: 'uint256[5]' },
      { name: 'min_mint_amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'calc_token_amount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amounts', type: 'uint256[5]' },
      { name: 'is_deposit', type: 'bool' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'remove_liquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'min_amounts', type: 'uint256[5]' },
    ],
    outputs: [{ name: '', type: 'uint256[5]' }],
  },
] as const

export const CLEAR_FACTORY_ABI = [
  {
    inputs: [],
    name: 'vaultsLength',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'vaults',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'isVault',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_indexes', type: 'uint256[]' }],
    name: 'getBatchVaultAddresses',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const CLEAR_REBALANCE_AGENT_ABI = [
  { inputs: [], name: 'owner', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'tokenBalances', outputs: [{ name: '', type: 'address[]' }, { name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'tokensLength', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '', type: 'address' }], name: 'tokens', outputs: [{ name: 'enabled', type: 'bool' }, { name: 'decimals', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], name: 'routeRates', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '', type: 'address' }], name: 'whitelistedSwappers', outputs: [{ name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_token', type: 'address' }], name: 'configureToken', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_from', type: 'address' }, { name: '_to', type: 'address' }, { name: '_rate', type: 'uint256' }], name: 'configureRoute', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_from', type: 'address' }, { name: '_to', type: 'address' }, { name: '_amountIn', type: 'uint256' }], name: 'estimateSwap', outputs: [{ name: 'amountOut', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_token', type: 'address' }, { name: '_amount', type: 'uint256' }], name: 'depositLiquidity', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_token', type: 'address' }, { name: '_amount', type: 'uint256' }], name: 'withdrawLiquidity', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_swapper', type: 'address' }], name: 'addSwapperToWhitelist', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_swapper', type: 'address' }], name: 'removeSwapperFromWhitelist', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const
