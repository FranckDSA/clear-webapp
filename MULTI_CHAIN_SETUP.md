# Multi-Chain Setup - Clear Protocol

L'application Clear Protocol supporte maintenant plusieurs chaînes (Ethereum Mainnet et Arbitrum Sepolia).

## Changements effectués

### 1. Configuration des chaînes (`src/config/wagmi.ts`)
- Ajout de `mainnet` en plus de `arbitrumSepolia`
- L'utilisateur peut maintenant basculer entre les chaînes via RainbowKit

### 2. Adresses de contrats multi-chaînes (`src/config/contracts.ts`)
- Nouvelle structure `ChainConfig` pour organiser les adresses par chaîne
- Mapping `CHAIN_CONFIGS` avec les configurations pour chaque chaîne:
  - **Ethereum Mainnet (chain 1)**:
    - ClearFactory: `0x78aba0729345219B8Ec4D5c9c19D23186E0803fB`
    - ClearOracle: `0x1eE149bd53B4193987109f604A1715CBA861d3a3`
    - ClearSwap: `0x07656EA4898760d55feA211015df247b44B9D81b`
    - ClearAccessManager: `0x02792c6E39A4F338283e9B6152e2182F9E2153b3`
    - ClearRebalanceAgent: `0xBbC47E15FeA3fE704C171Df665Ec3e81518e0E54`
    - Tokens: GHO, USDC, USDe, USDS, USDT (adresses mainnet)

  - **Arbitrum Sepolia (chain 421614)**: Configuration existante préservée

- Fonction `getChainConfig(chainId)` pour récupérer la configuration d'une chaîne

### 3. Hook personnalisé (`src/hooks/useChainConfig.ts`)
Nouveau hook qui retourne automatiquement la configuration de la chaîne active:
```typescript
const { chainId, addresses, tokens, graphqlClient } = useChainConfig()
```

### 4. Mise à jour des composants
Tous les composants ont été mis à jour pour utiliser `useChainConfig()`:
- `App.tsx` - Affiche le nom de la chaîne et des liens explorateur dynamiques
- `VaultDetails.tsx` - Utilise les adresses spécifiques à la chaîne
- `Swap.tsx` - Adresses de contrats dynamiques
- `OracleUpdate.tsx` - Oracle spécifique à la chaîne
- `RebalanceAgent.tsx` - Détection si l'agent est disponible sur la chaîne
- `Mint.tsx` - Tokens spécifiques à la chaîne
- `Stats.tsx` - GraphQL endpoint dynamique
- `CurvePools.tsx` - GraphQL endpoint dynamique

### 5. GraphQL multi-chaînes (`src/lib/graphql.ts`)
- Configuration `GRAPHQL_ENDPOINTS` avec un endpoint par chaîne
- Fonction `getGraphQLClient(chainId)` pour obtenir le bon client
- Hook `useGraphQLClient()` pour utilisation dans les composants

## Utilisation

### Basculer entre les chaînes
L'utilisateur peut cliquer sur l'icône de chaîne dans le bouton ConnectButton (en haut à droite) pour changer de réseau.

### Dans les composants
```typescript
import { useChainConfig } from '../hooks/useChainConfig'

function MyComponent() {
  const { addresses, tokens, graphqlClient } = useChainConfig()

  // Utiliser les adresses
  const oracleAddress = addresses.clearOracle

  // Utiliser les tokens
  const tokenList = Object.values(tokens)

  // Utiliser le client GraphQL
  const data = await graphqlClient.request(MY_QUERY)
}
```

## Points importants

1. **Rebalance Agent**: Affiche un message si non disponible sur la chaîne (adresse `0x0...0`)

2. **Backward Compatibility**: Les exports `ADDRESSES` et `TOKENS` par défaut pointent vers Arbitrum Sepolia

3. **GraphQL Endpoints**:
   - Arbitrum Sepolia: `https://api-arb-sepolia-clear.trevee.xyz/graphql`
   - Ethereum Mainnet: `https://api-mainnet-clear.trevee.xyz/graphql` (à configurer)

4. **Explorer Links**: Détection automatique:
   - Ethereum: etherscan.io
   - Arbitrum Sepolia: sepolia.arbiscan.io

## Configuration requise pour Ethereum Mainnet

⚠️ **À faire**:
1. Vérifier/mettre à jour l'adresse du defaultVault sur Ethereum (actuellement `0x0...0`)
2. Configurer l'endpoint GraphQL réel pour Ethereum Mainnet
3. Tester toutes les fonctionnalités sur Mainnet

## Architecture

```
User
  ↓ (change chain via RainbowKit)
useChainConfig() hook
  ↓
CHAIN_CONFIGS[chainId]
  ↓
{ addresses, tokens } ← Components use chain-specific config
  ↓
GraphQL Client (chain-specific endpoint)
```
