/**
 * Fund Poll Dialog
 * Modal for funding a poll with any cryptocurrency
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FundPollDialogProps {
  pollId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FundPollDialog({
  pollId,
  open,
  onOpenChange,
  onSuccess,
}: FundPollDialogProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const { createShift, loading } = useSideshift();

  const [currency, setCurrency] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositCoin, setDepositCoin] = useState('');

  const { status } = useShiftMonitor(shiftId);

  const handleReset = () => {
    setShiftId(null);
    setDepositAddress('');
    setAmount('');
    setDepositCoin('');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleFund = async () => {
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

    const result = await createShift({
      pollId,
      userAddress: address,
      purpose: 'fund_poll',
      sourceCoin: currency,
      destCoin: 'ETH', // Target chain's native token
      sourceAmount: amount,
    });

    if (result) {
      setShiftId(result.shift.id);
      setDepositAddress(result.sideshift.depositAddress);
      setDepositCoin(result.sideshift.depositCoin);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast({
      title: 'Copied!',
      description: 'Deposit address copied to clipboard',
    });
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fund Poll with Crypto</DialogTitle>
          <DialogDescription>
            Fund this poll using any cryptocurrency. Funds will be converted to ETH.
          </DialogDescription>
        </DialogHeader>

        {!depositAddress ? (
          // Step 1: Select currency and amount
          <div className="space-y-4 py-4">
            <CurrencySelector
              label="Select Currency"
              value={currency}
              onChange={setCurrency}
              disabled={loading}
            />

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount of {currency} you want to send
              </p>
            </div>

            <Button onClick={handleFund} disabled={loading || !amount} className="w-full">
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
        ) : (
          // Step 2: Show deposit address and monitor status
          <div className="space-y-4 py-4">
            {status && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(status)}>{status}</Badge>
              </div>
            )}

            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Send exactly {amount} {depositCoin} to:
                  </p>
                  <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                    <code className="flex-1 text-xs break-all">{depositAddress}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Send the exact amount from your wallet</p>
              <p>• Funds will be converted to ETH automatically</p>
              <p>• Once confirmed, ETH will be sent to the poll contract</p>
              <p>• This may take a few minutes depending on network congestion</p>
            </div>

            {status === 'settled' && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  ✓ Funding complete! The poll has been funded successfully.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Create Another
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
