/**
 * Network-aware Apollo Client for The Graph subgraph queries
 * Switches between Base Mainnet and Base Sepolia endpoints
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

// Subgraph endpoints for different networks
const SUBGRAPH_URLS = {
  // Base Mainnet (chainId: 8453)
  8453: process.env.NEXT_PUBLIC_SUBGRAPH_URL_BASE_MAINNET ||
        'https://api.studio.thegraph.com/query/122132/basepulse-mainnet/version/latest',

  // Base Sepolia (chainId: 84532)
  84532: process.env.NEXT_PUBLIC_SUBGRAPH_URL_BASE_SEPOLIA ||
         'https://api.studio.thegraph.com/query/122132/basepulse-sepolia/version/latest',
} as const

type SupportedChainId = keyof typeof SUBGRAPH_URLS

/**
 * Get subgraph URL for a specific chain
 */
export function getSubgraphUrl(chainId: number): string {
  const url = SUBGRAPH_URLS[chainId as SupportedChainId]

  if (!url) {
    console.warn(`No subgraph URL configured for chainId ${chainId}, falling back to Base Sepolia`)
    return SUBGRAPH_URLS[84532]
  }

  return url
}

/**
 * Create an Apollo Client instance for a specific network
 */
export function createApolloClient(chainId: number) {
  const uri = getSubgraphUrl(chainId)

  console.log(`[Apollo Client] Creating client for chainId ${chainId}:`, uri)

  return new ApolloClient({
    link: new HttpLink({
      uri,
      fetch,
    }),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            polls: {
              // Merge strategy for paginated polls
              keyArgs: ['where', 'orderBy', 'orderDirection'],
              merge(existing = [], incoming) {
                return [...existing, ...incoming]
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
      query: {
        fetchPolicy: 'cache-first',
      },
    },
  })
}

/**
 * Default Apollo Client instance
 * Uses Base Sepolia by default (testnet)
 */
export const apolloClient = createApolloClient(84532)

/**
 * Check if a chain has subgraph support
 */
export function isChainSupported(chainId: number): chainId is SupportedChainId {
  return chainId in SUBGRAPH_URLS
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(SUBGRAPH_URLS).map(Number)
}
