"use client"

import { useState } from "react"
import { useAccount, useChainId, useBalance } from "wagmi"
import { formatEther, formatUnits } from "viem"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { SubscriptionTiers } from "@/components/premium/subscription-tiers"
import { PremiumBadge } from "@/components/premium/premium-badge"
import { PremiumShiftDialog } from "@/components/sideshift/premium-shift-dialog"
import {
  useIsPremiumOrStaked,
  usePulseBalance,
  useAllTierPrices,
} from "@/lib/contracts/premium-contract-utils"
import { SubscriptionTier } from "@/lib/contracts/premium-contract"
import {
  Crown,
  ArrowLeft,
  Wallet,
  AlertCircle,
  ArrowRightLeft,
  Coins,
  Loader2,
} from "lucide-react"
import Link from "next/link"

export default function UpgradePage() {
  const [showShiftDialog, setShowShiftDialog] = useState(false)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: isPremiumData, isLoading: isPremiumLoading } = useIsPremiumOrStaked(address)
  const isPremium = isPremiumData as boolean | undefined
  const { data: pulseBalance, isLoading: pulseLoading } = usePulseBalance(address)
  const { data: ethBalance, isLoading: ethLoading } = useBalance({ address })
  const tierPrices = useAllTierPrices()

  // Check if on testnet (Base Sepolia)
  const isTestnet = chainId === 84532

  // Get minimum tier price (monthly) to check if user has enough PULSE
  const monthlyPrice = tierPrices[SubscriptionTier.MONTHLY]
  const hasSufficientPulse = pulseBalance && monthlyPrice && pulseBalance >= monthlyPrice

  // Format balances for display
  const formattedPulseBalance = pulseBalance
    ? Number(formatEther(pulseBalance)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0"
  const formattedEthBalance = ethBalance
    ? Number(formatEther(ethBalance.value)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : "0"

  const isLoadingBalances = pulseLoading || ethLoading

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dapp">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Upgrade to Premium</h1>
            {isConnected && <PremiumBadge />}
          </div>
          <p className="text-muted-foreground mt-1">
            Unlock exclusive features with a PULSE subscription
          </p>
        </div>
      </div>

      {/* Connect Wallet Prompt */}
      {!isConnected && (
        <Card className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-medium">Connect your wallet to get started</p>
                <p className="text-sm text-muted-foreground">
                  You need to connect your wallet to subscribe
                </p>
              </div>
            </div>
            <ConnectWalletButton />
          </CardContent>
        </Card>
      )}

      {/* Already Premium Message */}
      {isConnected && isPremium && (
        <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="flex items-center gap-3 py-6">
            <Crown className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">You're already a Premium member!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                You have access to all premium features.{" "}
                <Link href="/premium" className="underline hover:no-underline">
                  Manage subscription
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testnet Warning */}
      {isConnected && isTestnet && (
        <Alert className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <strong>Testnet Mode:</strong> SideShift bridging is not available on Base Sepolia testnet.
            Please switch to Base Mainnet to use the bridge feature, or obtain testnet PULSE tokens from a faucet.
          </AlertDescription>
        </Alert>
      )}

      {isConnected && !isPremium && (
        <>
          {/* Balance Display */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Your Balances
              </CardTitle>
              <CardDescription>
                Your current token balances on {isTestnet ? "Base Sepolia" : "Base"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PULSE Balance */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Coins className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PULSE</p>
                      <p className="text-lg font-semibold">
                        {isLoadingBalances ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          formattedPulseBalance
                        )}
                      </p>
                    </div>
                  </div>
                  {hasSufficientPulse && (
                    <Badge className="bg-green-500">Ready to subscribe</Badge>
                  )}
                </div>

                {/* ETH Balance */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-full">
                      <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ETH</p>
                      <p className="text-lg font-semibold">
                        {isLoadingBalances ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          formattedEthBalance
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Need PULSE? Section - Only show on mainnet */}
              {!isTestnet && !hasSufficientPulse && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed">
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Need PULSE tokens?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Convert any cryptocurrency to PULSE using SideShift. Supports BTC, ETH, USDC, and 100+ other coins.
                      </p>
                      <Button
                        className="mt-3"
                        onClick={() => setShowShiftDialog(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Bridge Crypto to PULSE
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Testnet notice for insufficient balance */}
              {isTestnet && !hasSufficientPulse && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Need testnet PULSE?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bridging is not available on testnet. To test premium features, please obtain testnet PULSE tokens from a faucet or switch to Base Mainnet.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Tiers */}
          <SubscriptionTiers />
        </>
      )}

      {/* Premium Shift Dialog */}
      <PremiumShiftDialog
        open={showShiftDialog}
        onOpenChange={setShowShiftDialog}
        onSuccess={() => {
          // Refresh the page to update balances
          window.location.reload()
        }}
      />
    </div>
  )
}
