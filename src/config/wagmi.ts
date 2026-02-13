import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arbitrumSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Clear Protocol',
  projectId: 'clear-protocol-testnet',
  chains: [arbitrumSepolia],
  ssr: false,
})
