import { useChainId, useChains } from 'wagmi'

export function useExplorer() {
  const chainId = useChainId()
  const chains = useChains()
  const currentChain = chains.find(c => c.id === chainId)

  const getExplorerUrl = () => {
    if (chainId === 1) return 'https://etherscan.io'
    if (chainId === 421614) return 'https://sepolia.arbiscan.io'
    return currentChain?.blockExplorers?.default.url || 'https://etherscan.io'
  }

  const explorerUrl = getExplorerUrl()

  return {
    explorerUrl,
    getAddressUrl: (address: string) => `${explorerUrl}/address/${address}`,
    getTxUrl: (txHash: string) => `${explorerUrl}/tx/${txHash}`,
  }
}
