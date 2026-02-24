import { useChainId } from 'wagmi'
import { useMemo } from 'react'
import { getChainConfig } from '../config/contracts'
import { getGraphQLClient } from '../lib/graphql'

/**
 * Hook to get chain-specific contract addresses and token configurations
 * Automatically updates when the user switches chains
 */
export function useChainConfig() {
  const chainId = useChainId()
  const config = getChainConfig(chainId)
  const graphqlClient = useMemo(() => getGraphQLClient(chainId), [chainId])

  return {
    chainId,
    addresses: config.addresses,
    tokens: config.tokens,
    graphqlClient,
  }
}

/**
 * Hook to get chain-specific contract addresses only
 */
export function useContractAddresses() {
  const { addresses } = useChainConfig()
  return addresses
}

/**
 * Hook to get chain-specific token configurations only
 */
export function useTokens() {
  const { tokens } = useChainConfig()
  return tokens
}

/**
 * Hook to get chain-specific GraphQL client
 */
export function useGraphQLClient() {
  const { graphqlClient } = useChainConfig()
  return graphqlClient
}
