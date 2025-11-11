/**
 * Bridge Deposit View Component
 * Shows deposit address and monitors shift status
 */

'use client';

import { useShiftMonitor } from '@/hooks/use-sideshift';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNetworkName } from '@/lib/utils/currency';

interface BridgeDepositViewProps {
  shiftId: string;
  depositAddress: string;
  depositCoin: string;
  depositNetwork: string;
  amount: string;
  destCoin: string;
  destNetwork: string;
  onReset: () => void;
  onClose: () => void;
}

export function BridgeDepositView({
  shiftId,
  depositAddress,
  depositCoin,
  depositNetwork,
  amount,
  destCoin,
  destNetwork,
  onReset,
  onClose,
}: BridgeDepositViewProps) {
  const { toast } = useToast();
  const { status, shiftData } = useShiftMonitor(shiftId);

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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting for your deposit...';
      case 'processing':
        return 'Processing your deposit...';
      case 'settling':
        return 'Settling to destination network...';
      case 'settled':
        return 'Bridge complete! Your funds have been sent.';
      case 'expired':
        return 'Shift expired. Please create a new one.';
      case 'refund':
      case 'refunded':
        return 'Shift refunded.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Status Badge */}
      {status && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className={getStatusColor(status)}>{status}</Badge>
          </div>
          {status === 'settled' && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Success
            </Badge>
          )}
        </div>
      )}

      {/* Status Description */}
      {status && (
        <p className="text-sm text-muted-foreground">{getStatusDescription(status)}</p>
      )}

      {/* Deposit Instructions */}
      {status !== 'settled' && (
        <Alert>
          <AlertDescription>
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Send exactly {amount} {depositCoin} on {formatNetworkName(depositNetwork)} to:
              </p>
              <div className="flex items-center gap-2 bg-background p-3 rounded-lg border">
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
      )}

      {/* Bridge Details */}
      <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium mb-3">Bridge Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">From:</span>
            <span className="font-medium">
              {amount} {depositCoin} ({formatNetworkName(depositNetwork)})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium">
              {destCoin} ({formatNetworkName(destNetwork)})
            </span>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      {status !== 'settled' && (
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-medium">Important:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Send from {formatNetworkName(depositNetwork)} network only</li>
            <li>Send the exact amount shown above</li>
            <li>Funds will arrive in your wallet on {formatNetworkName(destNetwork)}</li>
            <li>This may take a few minutes depending on network congestion</li>
            <li>Do not close this window until the shift is complete</li>
          </ul>
        </div>
      )}

      {/* Settled Message */}
      {status === 'settled' && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            Your {destCoin} has been successfully sent to your wallet on {formatNetworkName(destNetwork)}.
          </AlertDescription>
        </Alert>
      )}

      {/* Transaction Links */}
      {shiftData?.sideshiftData && (
        <div className="space-y-2">
          {shiftData.sideshiftData.depositHash && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deposit Transaction:</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a
                  href={`https://blockscan.com/tx/${shiftData.sideshiftData.depositHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
          {shiftData.sideshiftData.settleHash && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Settlement Transaction:</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a
                  href={`https://blockscan.com/tx/${shiftData.sideshiftData.settleHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1"
          disabled={status === 'processing' || status === 'settling'}
        >
          {status === 'settled' ? 'Bridge Again' : 'Create New Shift'}
        </Button>
        <Button onClick={onClose} className="flex-1">
          {status === 'settled' ? 'Done' : 'Close'}
        </Button>
      </div>
    </div>
  );
}
