import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { arbitrumSepolia, mainnet } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Clear Protocol',
  projectId: 'clear-protocol-testnet',
  chains: [mainnet, arbitrumSepolia],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_MAINNET_RPC_URL),
    [arbitrumSepolia.id]: http(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL),
  },
  ssr: false,
})
