/**
 * Contract deployment addresses configuration
 * Update these addresses via environment variables after deploying contracts to each network
 */

// Debug: Log environment variables
console.log('=== CONTRACT CONFIG DEBUG ===')
console.log('NEXT_PUBLIC_POLLS_CONTRACT_BASE:', process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE)
console.log('NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA:', process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA)

// Hardcoded fallback addresses (update these when deploying to production)
const BASE_MAINNET_CONTRACT = '0xfc0323F3c5eD271564Ca8F3d4C5FfAD32D553893' as const
const BASE_SEPOLIA_CONTRACT = '0xa3713739c39419aA1c6daf349dB4342Be59b9142' as const

// Staking and Premium Subscription contracts (to be deployed)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// PULSE token addresses (matching direct-sale-config)
const BASE_MAINNET_PULSE_TOKEN = '0x1b684A60309b0916C77834d62d117d306171FDFE' as const
const BASE_SEPOLIA_PULSE_TOKEN = '0x19821658D5798976152146d1c1882047670B898c' as const

export const CONTRACT_ADDRESSES = {
  // Base Mainnet (chainId: 8453)
  8453: {
    POLLS_CONTRACT: (process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE || BASE_MAINNET_CONTRACT) as `0x${string}`,
    STAKING_CONTRACT: (process.env.NEXT_PUBLIC_STAKING_CONTRACT_BASE || ZERO_ADDRESS) as `0x${string}`,
    PREMIUM_CONTRACT: (process.env.NEXT_PUBLIC_PREMIUM_CONTRACT_BASE || ZERO_ADDRESS) as `0x${string}`,
    PULSE_TOKEN: (process.env.NEXT_PUBLIC_PULSE_TOKEN_BASE || BASE_MAINNET_PULSE_TOKEN) as `0x${string}`,
    ZK_VERIFICATION_CONTRACT: (process.env.NEXT_PUBLIC_ZK_VERIFICATION_CONTRACT_BASE || ZERO_ADDRESS) as `0x${string}`,
    FEEDBACKS_CONTRACT: (process.env.NEXT_PUBLIC_FEEDBACKS_CONTRACT_BASE || ZERO_ADDRESS) as `0x${string}`,
  },
  // Base Sepolia Testnet (chainId: 84532)
  84532: {
    POLLS_CONTRACT: (process.env.NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA || BASE_SEPOLIA_CONTRACT) as `0x${string}`,
    STAKING_CONTRACT: (process.env.NEXT_PUBLIC_STAKING_CONTRACT_BASE_SEPOLIA || ZERO_ADDRESS) as `0x${string}`,
    PREMIUM_CONTRACT: (process.env.NEXT_PUBLIC_PREMIUM_CONTRACT_BASE_SEPOLIA || ZERO_ADDRESS) as `0x${string}`,
    PULSE_TOKEN: (process.env.NEXT_PUBLIC_PULSE_TOKEN_BASE_SEPOLIA || BASE_SEPOLIA_PULSE_TOKEN) as `0x${string}`,
    ZK_VERIFICATION_CONTRACT: (process.env.NEXT_PUBLIC_ZK_VERIFICATION_CONTRACT_BASE_SEPOLIA || ZERO_ADDRESS) as `0x${string}`,
    FEEDBACKS_CONTRACT: (process.env.NEXT_PUBLIC_FEEDBACKS_CONTRACT_BASE_SEPOLIA || ZERO_ADDRESS) as `0x${string}`,
  },
} as const

console.log('CONTRACT_ADDRESSES:', CONTRACT_ADDRESSES)

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES

export const SUPPORTED_CHAINS = Object.keys(CONTRACT_ADDRESSES).map(Number) as SupportedChainId[]

// Helper function to get contract address for a chain
export const getContractAddress = (chainId: number, contract: 'POLLS_CONTRACT' | 'STAKING_CONTRACT' | 'PREMIUM_CONTRACT' | 'PULSE_TOKEN' | 'ZK_VERIFICATION_CONTRACT' | 'FEEDBACKS_CONTRACT') => {
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