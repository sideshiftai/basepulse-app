/**
 * DirectTokenSale Contract Configuration
 *
 * This file contains the contract addresses and network configuration
 * for the DirectTokenSale contract across different networks.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_DIRECT_SALE_BASE: DirectTokenSale contract address on Base Mainnet
 * - NEXT_PUBLIC_DIRECT_SALE_BASE_SEPOLIA: DirectTokenSale contract address on Base Sepolia
 */

// Hardcoded fallback addresses (update these when deploying to production)
const BASE_MAINNET_DIRECT_SALE = '0xba6Ae648738969A66e7Fc014fc871E41827e7734' as const
const BASE_SEPOLIA_DIRECT_SALE = '0xde45219792494a130c707B426508Af4DAb4B93C8' as const // Upgradeable proxy

export const DIRECT_SALE_ADDRESSES = {
  // Base Mainnet (chainId: 8453)
  8453: (process.env.NEXT_PUBLIC_DIRECT_SALE_BASE || BASE_MAINNET_DIRECT_SALE) as `0x${string}`,
  // Base Sepolia Testnet (chainId: 84532)
  84532: (process.env.NEXT_PUBLIC_DIRECT_SALE_BASE_SEPOLIA || BASE_SEPOLIA_DIRECT_SALE) as `0x${string}`,
} as const;

export const USDC_ADDRESSES = {
  // Base Sepolia (testnet)
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  // Base Mainnet
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
} as const;

export type SupportedChainId = keyof typeof DIRECT_SALE_ADDRESSES;

/**
 * Get DirectTokenSale contract address for a specific chain
 * Supports environment variable override for easy deployment updates
 */
export function getDirectSaleAddress(chainId: number): `0x${string}` {
  const address = DIRECT_SALE_ADDRESSES[chainId as SupportedChainId];
  return address || "0x0000000000000000000000000000000000000000";
}

export function getUSDCAddress(chainId: number): string {
  const address = USDC_ADDRESSES[chainId as SupportedChainId];
  return address || "0x0000000000000000000000000000000000000000";
}

export const PULSE_TOKEN_ADDRESSES = {
  // Base Sepolia (testnet)
  84532: "0x19821658D5798976152146d1c1882047670B898c",
  // Base Mainnet
  8453: "0x1b684A60309b0916C77834d62d117d306171FDFE",
} as const;

export function getPulseTokenAddress(chainId: number): string {
  const address = PULSE_TOKEN_ADDRESSES[chainId as SupportedChainId];
  return address || "0x0000000000000000000000000000000000000000";
}

export const DIRECT_SALE_CONFIG = {
  tokenPrice: "0.01", // USDC per PULSE
  totalSupply: "1,000,000", // PULSE tokens
  minPurchase: "100", // PULSE tokens
  maxPurchasePerWallet: "50,000", // PULSE tokens
} as const;
