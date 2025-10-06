/**
 * Claim Rewards Dialog
 * Modal for claiming poll rewards in any cryptocurrency
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSideshift, useShiftMonitor } from '@/hooks/use-sideshift';
import { CurrencySelector } from './currency-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClaimRewardsDialogProps {
  pollId: string;
  rewardAmount: string; // In ETH
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ClaimRewardsDialog({
  pollId,
  rewardAmount,
  open,
  onOpenChange,
  onSuccess,
}: ClaimRewardsDialogProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const { createShift, loading } = useSideshift();

  const [currency, setCurrency] = useState('USDT');
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [estimatedAmount, setEstimatedAmount] = useState<string | null>(null);

  const { status, shiftData } = useShiftMonitor(shiftId);

  const handleReset = () => {
    setShiftId(null);
    setEstimatedAmount(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
    if (status === 'settled' && onSuccess) {
      onSuccess();
    }
  };

  const handleClaim = async () => {
    if (!address) {
      toast({
        variant: 'destructive',
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
      });
      return;
    }

    const result = await createShift({
      pollId,
      userAddress: address,
      purpose: 'claim_reward',
      sourceCoin: 'ETH',
      destCoin: currency,
    });

    if (result) {
      setShiftId(result.shift.id);
      // The backend will handle calling withdrawFunds to the Sideshift deposit address
      // and Sideshift will send the converted amount to the user
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500';
      case 'processing':
      case 'settling':
        return 'bg-blue-500';
      case 'settled':
        return 'bg-green-500';
      case 'expired':
      case 'refund':
      case 'refunded':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting for contract withdrawal...';
      case 'processing':
        return 'Processing your claim...';
      case 'settling':
        return 'Finalizing transaction...';
      case 'settled':
        return 'Rewards claimed successfully!';
      case 'expired':
        return 'Claim expired';
      case 'refund':
      case 'refunded':
        return 'Claim refunded';
      default:
        return 'Processing...';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim Your Rewards</DialogTitle>
          <DialogDescription>
            Claim your poll rewards in any cryptocurrency you prefer
          </DialogDescription>
        </DialogHeader>

        {!shiftId ? (
          // Step 1: Select currency
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reward Amount</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{rewardAmount} ETH</span>
                </div>
              </div>
            </div>

            <CurrencySelector
              label="Receive rewards in"
              value={currency}
              onChange={setCurrency}
              disabled={loading}
            />

            <Alert>
              <AlertDescription className="text-xs">
                Your {rewardAmount} ETH will be automatically converted to {currency} and
                sent to your wallet address: {address?.slice(0, 6)}...
                {address?.slice(-4)}
              </AlertDescription>
            </Alert>

            <Button onClick={handleClaim} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Claim in ${currency}`
              )}
            </Button>
          </div>
        ) : (
          // Step 2: Show claim status
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
              {status !== 'settled' && <Loader2 className="h-5 w-5 animate-spin" />}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(status || 'waiting')}>
                    {status || 'Initializing'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getStatusMessage(status || 'waiting')}
                </p>
              </div>
            </div>

            {status === 'settled' && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-semibold">✓ Rewards claimed successfully!</p>
                    <p className="text-sm">
                      Your {currency} has been sent to your wallet address.
                    </p>
                    {shiftData?.sideshiftData?.settleHash && (
                      <p className="text-xs">
                        Transaction: {shiftData.sideshiftData.settleHash.slice(0, 10)}...
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {status && ['processing', 'settling'].includes(status) && (
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Converting ETH to {currency}...</p>
                <p>• Sending to your wallet address</p>
                <p>• This may take a few minutes</p>
              </div>
            )}

            {status === 'settled' ? (
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            ) : (
              <Button variant="outline" onClick={handleClose} className="w-full">
                Close (Processing in background)
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
