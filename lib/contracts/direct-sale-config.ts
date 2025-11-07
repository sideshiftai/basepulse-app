/**
 * DirectTokenSale Contract Configuration
 *
 * This file contains the contract addresses and network configuration
 * for the DirectTokenSale contract across different networks.
 */

export const DIRECT_SALE_ADDRESSES = {
  // Base Sepolia (testnet)
  84532: "0x434d0fDd72AA670a229294E93D0933Ea685802fd",
  // Base Mainnet
  8453: "0x0000000000000000000000000000000000000000", // Update after deployment
} as const;

export const USDC_ADDRESSES = {
  // Base Sepolia (testnet)
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  // Base Mainnet
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
} as const;

export type SupportedChainId = keyof typeof DIRECT_SALE_ADDRESSES;

export function getDirectSaleAddress(chainId: number): string {
  const address = DIRECT_SALE_ADDRESSES[chainId as SupportedChainId];
  return address || "0x0000000000000000000000000000000000000000";
}

export function getUSDCAddress(chainId: number): string {
  const address = USDC_ADDRESSES[chainId as SupportedChainId];
  return address || "0x0000000000000000000000000000000000000000";
}

export const DIRECT_SALE_CONFIG = {
  tokenPrice: "0.01", // USDC per PULSE
  totalSupply: "1,000,000", // PULSE tokens
  minPurchase: "100", // PULSE tokens
  maxPurchasePerWallet: "50,000", // PULSE tokens
} as const;
