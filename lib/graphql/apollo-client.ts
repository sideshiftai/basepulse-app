/**
 * Apollo Client configuration for The Graph subgraph
 */

import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'

// Subgraph endpoint from environment
const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/122132/basepulse/v0.0.1'

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

// HTTP link to subgraph
const httpLink = new HttpLink({
  uri: SUBGRAPH_URL,
  fetch,
})

// Combine links
const link = from([errorLink, httpLink])

// Cache configuration with type policies
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        polls: {
          // Pagination helper for polls
          keyArgs: ['where', 'orderBy', 'orderDirection'],
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming]
          },
        },
      },
    },
    Poll: {
      keyFields: ['id'],
    },
    User: {
      keyFields: ['id'],
    },
    Token: {
      keyFields: ['id'],
    },
  },
})

// Create and export Apollo Client instance
export const apolloClient = new ApolloClient({
  link,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
})

// Helper to check if subgraph is available
export async function isSubgraphAvailable(): Promise<boolean> {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ _meta { block { number } } }',
      }),
    })
    return response.ok
  } catch (error) {
    console.error('Subgraph availability check failed:', error)
    return false
  }
}
