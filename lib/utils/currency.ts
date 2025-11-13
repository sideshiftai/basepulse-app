/**
 * Currency Utility Functions
 * Client-side helpers for working with cryptocurrencies
 */

/**
 * List of common stablecoins
 */
const STABLECOINS = [
  'USDC',
  'USDT',
  'DAI',
  'BUSD',
  'TUSD',
  'USDD',
  'FRAX',
  'GUSD',
  'USDP',
  'LUSD',
] as const;

/**
 * Check if a coin is a stablecoin
 * @param coin - Coin symbol (e.g., 'USDC', 'BTC')
 * @returns True if the coin is a stablecoin
 */
export function isStablecoin(coin: string): boolean {
  return STABLECOINS.includes(coin.toUpperCase() as any);
}

/**
 * Get the default destination coin based on the source coin
 * - Stablecoins convert to USDC
 * - Other coins convert to ETH
 * @param sourceCoin - The source cryptocurrency
 * @returns Recommended destination coin
 */
export function getDefaultDestinationCoin(sourceCoin: string): string {
  return isStablecoin(sourceCoin) ? 'USDC' : 'ETH';
}

/**
 * Get the display name for a coin
 * @param coin - Coin symbol
 * @returns Human-readable name
 */
export function getCoinDisplayName(coin: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDC: 'USD Coin',
    USDT: 'Tether',
    DAI: 'Dai',
    BNB: 'BNB',
    MATIC: 'Polygon',
    AVAX: 'Avalanche',
    ARB: 'Arbitrum',
    OP: 'Optimism',
  };
  return names[coin.toUpperCase()] || coin;
}

/**
 * Format network name for display
 * @param network - Network identifier (e.g., 'baseSepolia', 'bsc')
 * @returns Human-readable network name
 */
export function formatNetworkName(network: string): string {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    base: 'Base',
    baseSepolia: 'Base Sepolia',
    bsc: 'BSC',
    bscTestnet: 'BSC Testnet',
    polygon: 'Polygon',
    polygonMumbai: 'Polygon Mumbai',
    arbitrum: 'Arbitrum',
    arbitrumSepolia: 'Arbitrum Sepolia',
    optimism: 'Optimism',
    optimismSepolia: 'Optimism Sepolia',
    avalanche: 'Avalanche',
    avalancheFuji: 'Avalanche Fuji',
  };
  return names[network] || network.charAt(0).toUpperCase() + network.slice(1);
}

/**
 * Map chain ID to SideShift network identifier
 * Used to determine the settlement network for fund-poll operations
 * @param chainId - EVM chain ID (e.g., 8453 for Base, 84532 for Base Sepolia)
 * @returns SideShift network identifier (e.g., 'base', 'baseSepolia')
 */
export function getNetworkForChain(chainId: number): string {
  const networkMap: Record<number, string> = {
    8453: 'base',           // Base Mainnet
    84532: 'baseSepolia',   // Base Sepolia Testnet
  };
  return networkMap[chainId] || 'base'; // Default to base mainnet
}

/**
 * List of native tokens that don't have contract addresses
 * These are the blockchain's native currency
 */
const NATIVE_TOKENS = [
  'ETH',   // Ethereum, Base, Arbitrum, Optimism
  'BNB',   // BSC
  'MATIC', // Polygon
  'AVAX',  // Avalanche
  'BTC',   // Bitcoin (non-EVM)
  'SOL',   // Solana (non-EVM)
] as const;

/**
 * Check if a currency is a native token
 * Native tokens don't have contract addresses (they're the blockchain's currency)
 * @param coin - Coin symbol (e.g., 'ETH', 'USDC', 'BTC')
 * @returns True if the coin is a native token
 */
export function isNativeToken(coin: string): boolean {
  return NATIVE_TOKENS.includes(coin.toUpperCase() as any);
}

/**
 * Get token contract details from SideShift API assets data
 * @param assets - Array of supported assets from useSupportedAssets()
 * @param coin - Coin symbol (e.g., 'USDC', 'USDT')
 * @param network - Network identifier (e.g., 'base', 'ethereum', 'bsc')
 * @returns Contract address and decimals, or null if not found
 */
export function getTokenContract(
  assets: Array<{
    coin: string;
    tokenDetails?: {
      [network: string]: {
        contractAddress: string;
        decimals: number;
      };
    };
  }>,
  coin: string,
  network: string
): { contractAddress: string; decimals: number } | null {
  // Native tokens don't have contract addresses
  if (isNativeToken(coin)) {
    return null;
  }

  // Find the asset
  const asset = assets.find(a => a.coin.toLowerCase() === coin.toLowerCase());

  if (!asset?.tokenDetails) {
    return null;
  }

  // Get token details for the specific network
  const tokenDetail = asset.tokenDetails[network.toLowerCase()];
  return tokenDetail || null;
}
