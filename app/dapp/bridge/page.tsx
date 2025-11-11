"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useSideshift } from "@/hooks/use-sideshift";
import { BridgeForm } from "@/components/sideshift/bridge-form";
import { BridgeDepositView } from "@/components/sideshift/bridge-deposit-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeftRight, Info } from "lucide-react";
import { ConnectWalletButton } from "@/components/connect-wallet-button";

export default function BridgePage() {
  const { isConnected } = useAccount();
  const { loading } = useSideshift();

  const [depositData, setDepositData] = useState<{
    shiftId: string;
    depositAddress: string;
    depositCoin: string;
    depositNetwork: string;
    amount: string;
    destCoin: string;
    destNetwork: string;
  } | null>(null);

  const handleShiftCreated = (data: {
    shiftId: string;
    depositAddress: string;
    depositCoin: string;
    depositNetwork: string;
    amount: string;
    destCoin: string;
    destNetwork: string;
  }) => {
    setDepositData(data);
  };

  const handleReset = () => {
    setDepositData(null);
  };

  const handleClose = () => {
    setDepositData(null);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Bridge Your Crypto</h2>
            <p className="text-muted-foreground mb-6">
              Transfer any cryptocurrency between blockchain networks
            </p>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
            <ArrowLeftRight className="h-8 w-8" />
            Crypto Bridge
          </h1>
          <p className="text-muted-foreground">
            Transfer any cryptocurrency between blockchain networks
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Bridge your crypto across networks using SideShift.ai. Simply select
            your source and destination currencies, and we'll handle the rest.
          </AlertDescription>
        </Alert>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {depositData ? "Send Your Crypto" : "Bridge Configuration"}
            </CardTitle>
            <CardDescription>
              {depositData
                ? "Send your crypto to the deposit address below"
                : "Configure your bridge transfer"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!depositData ? (
              <BridgeForm onShiftCreated={handleShiftCreated} loading={loading} />
            ) : (
              <BridgeDepositView
                shiftId={depositData.shiftId}
                depositAddress={depositData.depositAddress}
                depositCoin={depositData.depositCoin}
                depositNetwork={depositData.depositNetwork}
                amount={depositData.amount}
                destCoin={depositData.destCoin}
                destNetwork={depositData.destNetwork}
                onReset={handleReset}
                onClose={handleClose}
              />
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Cross-Chain</h3>
              <p className="text-xs text-muted-foreground">
                Bridge between any supported blockchain networks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Any Token</h3>
              <p className="text-xs text-muted-foreground">
                Support for hundreds of cryptocurrencies
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Fast & Secure</h3>
              <p className="text-xs text-muted-foreground">
                Powered by SideShift.ai's trusted infrastructure
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
