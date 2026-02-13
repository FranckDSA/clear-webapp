import { type Address } from 'viem'

// Deployed on Arbitrum Sepolia (chain 421614)
export const ADDRESSES = {
  clearFactory: '0x9e422482f0ffC1f0b98f94db79bC771B184fD71A' as Address,
  clearOracle: '0x81Ff66eEf8516C44187B47C6a497b248eA74213D' as Address,
  clearSwap: '0x745dbbA17916112DB6c5289863073705A3644db1' as Address,
  clearAccessManager: '0x665a87D3FE39e2B5Aa8667747E23871d124D3785' as Address,
  // The vault deployed via the deploy script
  defaultVault: '0x02912591442Beb7Fd824Df4c90006093371898EF' as Address,
} as const

export const TOKENS: Record<string, { address: Address; symbol: string; decimals: number }> = {
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
}

export const TOKEN_BY_ADDRESS: Record<string, { address: Address; symbol: string; decimals: number }> =
  Object.fromEntries(
    Object.values(TOKENS).map((t) => [t.address.toLowerCase(), t])
  )

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
