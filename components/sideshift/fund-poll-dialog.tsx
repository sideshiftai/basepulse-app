/**
 * Fund Poll Dialog
 * Modal for funding a poll with any cryptocurrency
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useSideshift, useShiftMonitor } from '@/hooks/use-sideshift';
import { CurrencySelector } from './currency-selector';
import { NetworkSelector } from './network-selector';
import { FundingSuccessDialog } from './funding-success-dialog';
import { FundPollConfirmationDialog } from './fund-poll-confirmation-dialog';
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
import { Copy, ExternalLink, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDefaultDestinationCoin, formatNetworkName } from '@/lib/utils/currency';

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
  const chainId = useChainId();
  const { toast } = useToast();
  const { createShift, loading } = useSideshift();

  const [currency, setCurrency] = useState('USDC');
  const [sourceNetwork, setSourceNetwork] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositCoin, setDepositCoin] = useState('');
  const [depositNetwork, setDepositNetwork] = useState('');
  const [settledAmount, setSettledAmount] = useState('');
  const [settledToken, setSettledToken] = useState('');
  const [settledNetwork, setSettledNetwork] = useState('');

  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showFundingDialog, setShowFundingDialog] = useState(false);

  const { status, shiftData } = useShiftMonitor(shiftId);

  // Show success dialog when shift settles
  useEffect(() => {
    if (status === 'settled' && shiftData && !showSuccessDialog) {
      // Extract settled amount and details
      const settleAmount = shiftData.sideshiftData?.settleAmount || amount;
      const settleCoin = shiftData.sideshiftData?.settleCoin || getDefaultDestinationCoin(currency);
      const settleNet = shiftData.sideshiftData?.settleNetwork || 'base';

      setSettledAmount(settleAmount);
      setSettledToken(settleCoin);
      setSettledNetwork(settleNet);
      setShowSuccessDialog(true);
    }
  }, [status, shiftData]);

  const handleReset = () => {
    setShiftId(null);
    setDepositAddress('');
    setAmount('');
    setDepositCoin('');
    setDepositNetwork('');
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

    // Backend will automatically determine destNetwork based on poll chain
    // We determine destCoin here: USDC for stablecoins, ETH for others
    const result = await createShift({
      pollId,
      userAddress: address,
      purpose: 'fund_poll',
      sourceCoin: currency,
      destCoin: getDefaultDestinationCoin(currency),
      sourceNetwork: sourceNetwork || undefined,
      sourceAmount: amount,
      // Only pass chainId if it's a valid chain (not 0 or undefined)
      ...(chainId && chainId > 0 ? { chainId } : {}),
      // destNetwork will be auto-determined from poll's chain by backend
    });

    if (result) {
      setShiftId(result.shift.id);
      setDepositAddress(result.sideshift.depositAddress);
      setDepositCoin(result.sideshift.depositCoin);
      setDepositNetwork(result.sideshift.depositNetwork);
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
            Fund this poll using any cryptocurrency from any supported network.
          </DialogDescription>
        </DialogHeader>

        {!depositAddress ? (
          // Step 1: Select currency, network, and amount
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Currency</Label>
              <CurrencySelector
                value={currency}
                onChange={setCurrency}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Deposit Network</Label>
              <NetworkSelector
                coin={currency}
                value={sourceNetwork}
                onValueChange={setSourceNetwork}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Select which network you'll send {currency} from
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount of {currency} you want to send
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Funds will be automatically converted to {getDefaultDestinationCoin(currency)} on Base network for the poll.
              </AlertDescription>
            </Alert>

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
                    Send exactly {amount} {depositCoin} on {formatNetworkName(depositNetwork)} to:
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
              <p>• Send from {formatNetworkName(depositNetwork)} network</p>
              <p>• Funds will be converted to {getDefaultDestinationCoin(currency)} on Base</p>
              <p>• Once confirmed, funds will arrive in your wallet on Base</p>
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

      {/* Success Dialog - shown after shift settles */}
      {address && shiftId && (
        <FundingSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          amount={settledAmount}
          token={settledToken}
          network={settledNetwork}
          walletAddress={address}
          onFundPoll={() => {
            setShowSuccessDialog(false);
            setShowFundingDialog(true);
          }}
        />
      )}

      {/* Funding Confirmation Dialog - shown when user clicks Fund Poll */}
      {address && shiftId && (
        <FundPollConfirmationDialog
          open={showFundingDialog}
          onOpenChange={setShowFundingDialog}
          pollId={pollId}
          amount={settledAmount}
          token={settledToken}
          shiftId={shiftId}
          onSuccess={() => {
            toast({
              title: 'Success!',
              description: 'Poll funded successfully',
            });
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}
    </Dialog>
  );
}
