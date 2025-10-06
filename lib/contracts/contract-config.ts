/**
 * Contract deployment addresses configuration
 * Update these addresses after deploying the PollsContract to each network
 */
export const CONTRACT_ADDRESSES = {
  // Base Mainnet (chainId: 8453)
  8453: {
    POLLS_CONTRACT: '0x0000000000000000000000000000000000000000', // TODO: Replace with actual deployed address
  },
  // Base Sepolia Testnet (chainId: 84532)
  84532: {
    POLLS_CONTRACT: '0x0000000000000000000000000000000000000000', // TODO: Replace with actual deployed address
  },
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES

export const SUPPORTED_CHAINS = Object.keys(CONTRACT_ADDRESSES).map(Number) as SupportedChainId[]

// Helper function to get contract address for a chain
export const getContractAddress = (chainId: number, contract: 'POLLS_CONTRACT') => {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId]
  return addresses?.[contract]
}

// Environment-based configuration
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    isDevelopment,
    isProduction,
    // Use testnet in development, mainnet in production (can be overridden)
    defaultChainId: isDevelopment ? 84532 : 8453,
    // Enable mock data when contracts are not deployed
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  }
}