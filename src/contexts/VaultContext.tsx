import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import { getGraphQLClient, GET_VAULTS, ClearVaultData } from '../lib/graphql'

const STORAGE_KEY = 'clear-selected-vault'

interface VaultContextType {
  vaults: ClearVaultData[]
  selectedVault: ClearVaultData | null
  selectedVaultAddress: string | null
  setSelectedVaultAddress: (address: string | null) => void
  isLoading: boolean
  error: Error | null
}

const VaultContext = createContext<VaultContextType | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const chainId = useChainId()
  const [selectedVaultAddress, setSelectedVaultAddressState] = useState<string | null>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed[chainId] || null
      }
    } catch {
      // Ignore parse errors
    }
    return null
  })

  // Fetch vaults from GraphQL
  const { data, isLoading, error } = useQuery({
    queryKey: ['vaults', chainId],
    queryFn: async () => {
      const client = getGraphQLClient(chainId)
      const result = await client.request<{ clearVaults: ClearVaultData[] }>(GET_VAULTS)
      return result.clearVaults
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const vaults = data || []

  // Find the selected vault object
  const selectedVault = vaults.find(v => v.address.toLowerCase() === selectedVaultAddress?.toLowerCase()) || null

  // Auto-select the first vault if none selected and vaults are loaded
  useEffect(() => {
    if (!selectedVaultAddress && vaults.length > 0) {
      setSelectedVaultAddressState(vaults[0].address)
    }
  }, [vaults, selectedVaultAddress])

  // Update localStorage when selection changes
  useEffect(() => {
    if (selectedVaultAddress) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const parsed = stored ? JSON.parse(stored) : {}
        parsed[chainId] = selectedVaultAddress
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      } catch {
        // Ignore storage errors
      }
    }
  }, [selectedVaultAddress, chainId])

  // Reset selection when chain changes if stored vault doesn't exist on new chain
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const storedAddress = parsed[chainId]
        if (storedAddress) {
          setSelectedVaultAddressState(storedAddress)
        } else {
          setSelectedVaultAddressState(null)
        }
      } else {
        setSelectedVaultAddressState(null)
      }
    } catch {
      setSelectedVaultAddressState(null)
    }
  }, [chainId])

  const setSelectedVaultAddress = (address: string | null) => {
    setSelectedVaultAddressState(address)
  }

  return (
    <VaultContext.Provider
      value={{
        vaults,
        selectedVault,
        selectedVaultAddress,
        setSelectedVaultAddress,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVaultContext() {
  const context = useContext(VaultContext)
  if (!context) {
    throw new Error('useVaultContext must be used within a VaultProvider')
  }
  return context
}
