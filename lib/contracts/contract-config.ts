/**
 * Contract deployment addresses configuration
 * Update these addresses via environment variables after deploying the PollsContract to each network
 */

// Debug: Log environment variables
console.log('=== CONTRACT CONFIG DEBUG ===')
console.log('NEXT_PUBLIC_POLLS_CONTRACT_BASE:', process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE)
console.log('NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA:', process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA)

// Hardcoded fallback addresses (update these when deploying to production)
const BASE_MAINNET_CONTRACT = '0xfc0323F3c5eD271564Ca8F3d4C5FfAD32D553893' as const
const BASE_SEPOLIA_CONTRACT = '0xa3713739c39419aA1c6daf349dB4342Be59b9142' as const

export const CONTRACT_ADDRESSES = {
  // Base Mainnet (chainId: 8453)
  8453: {
    POLLS_CONTRACT: (process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE || BASE_MAINNET_CONTRACT) as `0x${string}`,
  },
  // Base Sepolia Testnet (chainId: 84532)
  84532: {
    POLLS_CONTRACT: (process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA || BASE_SEPOLIA_CONTRACT) as `0x${string}`,
  },
} as const

console.log('CONTRACT_ADDRESSES:', CONTRACT_ADDRESSES)

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