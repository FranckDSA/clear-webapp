/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAINNET_RPC_URL: string
  readonly VITE_ARBITRUM_SEPOLIA_RPC_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
