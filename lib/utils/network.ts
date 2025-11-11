/**
 * Network utility functions
 */

export interface NetworkInfo {
  chainId: number
  name: string
  shortName: string
  color: string
  isTestnet: boolean
}

/**
 * Network configurations
 */
export const NETWORKS: Record<number, NetworkInfo> = {
  // Base Mainnet
  8453: {
    chainId: 8453,
    name: 'Base Mainnet',
    shortName: 'Base',
    color: '#0052FF', // Base blue
    isTestnet: false,
  },
  // Base Sepolia
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    shortName: 'Sepolia',
    color: '#7B3FE4', // Purple for testnet
    isTestnet: true,
  },
}

/**
 * Get network info by chain ID
 */
export function getNetworkInfo(chainId: number): NetworkInfo | undefined {
  return NETWORKS[chainId]
}

/**
 * Get network name by chain ID
 */
export function getNetworkName(chainId: number): string {
  return NETWORKS[chainId]?.name || `Chain ${chainId}`
}

/**
 * Get network short name by chain ID
 */
export function getNetworkShortName(chainId: number): string {
  return NETWORKS[chainId]?.shortName || `Chain ${chainId}`
}

/**
 * Get network color by chain ID
 */
export function getNetworkColor(chainId: number): string {
  return NETWORKS[chainId]?.color || '#9CA3AF'
}

/**
 * Check if network is a testnet
 */
export function isTestnet(chainId: number): boolean {
  return NETWORKS[chainId]?.isTestnet ?? true
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(NETWORKS).map(Number)
}

/**
 * Check if chain ID is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in NETWORKS
}
