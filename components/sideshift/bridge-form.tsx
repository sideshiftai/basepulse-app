/**
 * Bridge Form Component
 * Form for bridging crypto between networks
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { sideshiftAPI, SideshiftPairInfo } from '@/lib/api/sideshift-client';
import { useSupportedAssets } from '@/hooks/use-sideshift';
import { CurrencySelector } from './currency-selector';
import { NetworkSelector } from './network-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, ArrowDown, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNetworkName } from '@/lib/utils/currency';

interface BridgeFormProps {
  onShiftCreated: (data: {
    shiftId: string;
    depositAddress: string;
    depositCoin: string;
    depositNetwork: string;
    amount: string;
    destCoin: string;
    destNetwork: string;
  }) => void;
  loading: boolean;
}

// Network name to chain ID mapping (reverse of backend's CHAIN_TO_NETWORK_MAP)
const NETWORK_TO_CHAIN_MAP: Record<string, number> = {
  'ethereum': 1,
  'base': 8453,
  'baseSepolia': 84532,
  'bsc': 56,
  'bscTestnet': 97,
  'polygon': 137,
  'polygonMumbai': 80001,
  'arbitrum': 42161,
  'arbitrumSepolia': 421614,
  'optimism': 10,
  'optimismSepolia': 11155420,
  'avalanche': 43114,
  'avalancheFuji': 43113,
};

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export function BridgeForm({ onShiftCreated, loading }: BridgeFormProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { assets } = useSupportedAssets();

  // Source fields
  const [sourceCoin, setSourceCoin] = useState('USDC');
  const [sourceNetwork, setSourceNetwork] = useState<string>('');
  const [amount, setAmount] = useState('');

  // Destination fields
  const [destCoin, setDestCoin] = useState('USDC');
  const [destNetwork, setDestNetwork] = useState<string>('');

  // Pair info for min/max amounts
  const [pairInfo, setPairInfo] = useState<SideshiftPairInfo | null>(null);
  const [loadingPairInfo, setLoadingPairInfo] = useState(false);

  // Token contract address and decimals from SideShift supported assets
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [tokenDecimalsFromAssets, setTokenDecimalsFromAssets] = useState<number | null>(null);

  // Determine if source coin is a native token (ETH, BNB, MATIC, AVAX, etc.)
  const isNativeToken = sourceCoin === 'ETH' || sourceCoin === 'BNB' || sourceCoin === 'MATIC' || sourceCoin === 'AVAX';

  // Get expected chain ID for source network
  const expectedChainId = sourceNetwork ? NETWORK_TO_CHAIN_MAP[sourceNetwork] : undefined;
  const isCorrectNetwork = expectedChainId === currentChainId;

  // Native token balance (ETH, BNB, etc.)
  const { data: nativeBalance } = useBalance({
    address,
    chainId: expectedChainId,
    query: {
      enabled: !!address && isNativeToken && isCorrectNetwork,
    },
  });

  // ERC20 token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: expectedChainId,
    query: {
      enabled: !!address && !isNativeToken && !!tokenAddress && isCorrectNetwork,
    },
  });

  // Get token decimals for ERC20 tokens
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: expectedChainId,
    query: {
      enabled: !isNativeToken && !!tokenAddress && isCorrectNetwork,
    },
  });

  // Determine balance and decimals
  const balance = isNativeToken ? nativeBalance?.value : tokenBalance;
  const decimals = isNativeToken
    ? 18
    : (tokenDecimals || tokenDecimalsFromAssets || 18);

  // Format balance for display
  const formattedBalance = balance
    ? formatUnits(balance, decimals)
    : '0';

  // Fetch pair info when currency/network changes
  useEffect(() => {
    const fetchPairInfo = async () => {
      if (!sourceCoin || !destCoin) return;

      setLoadingPairInfo(true);
      try {
        const info = await sideshiftAPI.getPairInfo(
          sourceCoin,
          destCoin,
          sourceNetwork || undefined,
          destNetwork || undefined
        );
        setPairInfo(info);

        // Lookup token contract address from SideShift supported assets
        if (sourceNetwork && !isNativeToken && assets.length > 0) {
          const asset = assets.find((a) => a.coin === sourceCoin);
          if (asset?.tokenDetails?.[sourceNetwork]) {
            const tokenDetail = asset.tokenDetails[sourceNetwork];
            setTokenAddress(tokenDetail.contractAddress);
            setTokenDecimalsFromAssets(tokenDetail.decimals);
          } else {
            setTokenAddress(null);
            setTokenDecimalsFromAssets(null);
          }
        } else {
          // For native tokens, no contract address needed
          setTokenAddress(null);
          setTokenDecimalsFromAssets(null);
        }
      } catch (error) {
        console.error('Failed to fetch pair info:', error);
        setPairInfo(null);
        setTokenAddress(null);
        setTokenDecimalsFromAssets(null);
      } finally {
        setLoadingPairInfo(false);
      }
    };

    fetchPairInfo();
  }, [sourceCoin, destCoin, sourceNetwork, destNetwork, isNativeToken, assets]);

  // Handle Max button click
  const handleMaxClick = () => {
    if (!balance) {
      toast({
        variant: 'destructive',
        title: 'No balance',
        description: 'You don\'t have any balance to bridge',
      });
      return;
    }

    let maxAmount = formattedBalance;

    // For native tokens (ETH, BNB, etc.), leave a small buffer for gas fees
    if (isNativeToken && balance) {
      // Leave 0.01 native token for gas fees (e.g., 0.01 ETH, 0.01 BNB)
      const gasBuffer = parseUnits('0.01', decimals);

      if (balance > gasBuffer) {
        const balanceMinusGas = balance - gasBuffer;
        maxAmount = formatUnits(balanceMinusGas, decimals);
      } else {
        toast({
          variant: 'destructive',
          title: 'Insufficient balance',
          description: 'You need to leave some balance for gas fees',
        });
        return;
      }
    }

    setAmount(maxAmount);

    toast({
      title: 'Max amount set',
      description: `Amount set to ${parseFloat(maxAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${sourceCoin}`,
    });
  };

  // Handle network switch
  const handleSwitchNetwork = async () => {
    if (!expectedChainId) return;

    try {
      await switchChain({ chainId: expectedChainId });
      toast({
        title: 'Network switched',
        description: `Switched to ${formatNetworkName(sourceNetwork)}`,
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to switch network',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleSubmit = async () => {
    if (!address) {
      toast({
        variant: 'destructive',
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
      });
      return;
    }

    if (!sourceNetwork) {
      toast({
        variant: 'destructive',
        title: 'Source network required',
        description: 'Please select a source network',
      });
      return;
    }

    if (!destNetwork) {
      toast({
        variant: 'destructive',
        title: 'Destination network required',
        description: 'Please select a destination network',
      });
      return;
    }

    // Check if amount meets minimum requirement
    if (pairInfo && parseFloat(amount) < parseFloat(pairInfo.min)) {
      toast({
        variant: 'destructive',
        title: 'Amount too low',
        description: `Minimum deposit is ${parseFloat(pairInfo.min).toFixed(2)} ${sourceCoin}`,
      });
      return;
    }

    try {
      const result = await sideshiftAPI.createShift({
        userAddress: address,
        purpose: 'bridge',
        sourceCoin,
        destCoin,
        sourceNetwork,
        destNetwork,
        sourceAmount: amount,
      });

      if (result) {
        onShiftCreated({
          shiftId: result.shift.id,
          depositAddress: result.sideshift.depositAddress,
          depositCoin: result.sideshift.depositCoin,
          depositNetwork: result.sideshift.depositNetwork,
          amount,
          destCoin,
          destNetwork,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create shift',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Source Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">From</h3>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label>Currency</Label>
            <CurrencySelector
              value={sourceCoin}
              onChange={setSourceCoin}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <NetworkSelector
              coin={sourceCoin}
              value={sourceNetwork}
              onValueChange={setSourceNetwork}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Select which network you'll send {sourceCoin} from
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              {address && isCorrectNetwork && balance && balance > 0n && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  disabled={loading}
                  className="h-6 px-2 text-xs"
                >
                  Max
                </Button>
              )}
            </div>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              disabled={loading}
            />

            {/* Balance display or network warning */}
            {address && sourceNetwork && (
              <>
                {!isCorrectNetwork ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      Switch to {formatNetworkName(sourceNetwork)} to see balance
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSwitchNetwork}
                      disabled={loading}
                      className="h-6 px-2 text-xs"
                    >
                      Switch Network
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    Balance: {parseFloat(formattedBalance).toLocaleString(undefined, {
                      maximumFractionDigits: 6
                    })} {sourceCoin}
                    {balance && balance > 0n && ' • Click Max to use full balance'}
                  </p>
                )}
              </>
            )}

            {/* Pair info (min/max) */}
            {loadingPairInfo ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading minimum amount...
              </p>
            ) : pairInfo ? (
              <p className="text-xs text-muted-foreground">
                Minimum: {parseFloat(pairInfo.min).toFixed(2)} {sourceCoin} • Maximum: {parseFloat(pairInfo.max).toFixed(2)} {sourceCoin}
              </p>
            ) : !address || !sourceNetwork ? (
              <p className="text-xs text-muted-foreground">
                Enter the amount of {sourceCoin} you want to send
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Arrow Separator */}
      <div className="flex justify-center">
        <div className="p-2 rounded-full bg-muted">
          <ArrowDown className="h-4 w-4" />
        </div>
      </div>

      {/* Destination Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">To</h3>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label>Currency</Label>
            <CurrencySelector
              value={destCoin}
              onChange={setDestCoin}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <NetworkSelector
              coin={destCoin}
              value={destNetwork}
              onValueChange={setDestNetwork}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Select which network you want to receive {destCoin} on
            </p>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      {pairInfo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Exchange rate: 1 {sourceCoin} = {parseFloat(pairInfo.rate).toFixed(6)} {destCoin}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading || !amount || !sourceNetwork || !destNetwork}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating shift...
          </>
        ) : (
          'Get Deposit Address'
        )}
      </Button>
    </div>
  );
}
