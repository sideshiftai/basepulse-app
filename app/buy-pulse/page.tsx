"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Coins, TrendingUp, Users, ShoppingCart, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import {
  useSaleStats,
  useRemainingAllowance,
  usePurchasedAmount,
  useBuyWithETH,
  useBuyWithUSDC,
  useApproveUSDC,
  useCalculateTokensForETH,
  useCalculateTokensForUSDC,
  useCalculateETHCost,
  useCalculateUSDCCost,
  useIsSaleActive,
  formatTokenAmount,
  formatUSDCAmount,
  formatETHAmount,
  useDirectSaleAddress,
} from "@/lib/contracts/direct-sale-utils"
import { DIRECT_SALE_CONFIG } from "@/lib/contracts/direct-sale-config"

export default function BuyPulsePage() {
  const [paymentMethod, setPaymentMethod] = useState<"eth" | "usdc">("usdc")
  const [tokenAmount, setTokenAmount] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [needsApproval, setNeedsApproval] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const contractAddress = useDirectSaleAddress()

  // Contract read hooks
  const { data: saleStats } = useSaleStats()
  const { data: isSaleActive } = useIsSaleActive()
  const { data: remainingAllowance } = useRemainingAllowance(address)
  const { data: purchasedAmount } = usePurchasedAmount(address)

  // Write hooks
  const { buyWithETH, isPending: isBuyingETH, isConfirming: isConfirmingETH, isSuccess: isSuccessETH, error: errorETH } = useBuyWithETH()
  const { buyWithUSDC, isPending: isBuyingUSDC, isConfirming: isConfirmingUSDC, isSuccess: isSuccessUSDC, error: errorUSDC } = useBuyWithUSDC()
  const { approveUSDC, isPending: isApproving, isConfirming: isConfirmingApproval, isSuccess: isSuccessApproval } = useApproveUSDC()

  // Calculation hooks
  const { data: tokensForETH } = useCalculateTokensForETH(paymentMethod === "eth" ? paymentAmount : "0")
  const { data: tokensForUSDC } = useCalculateTokensForUSDC(paymentMethod === "usdc" ? paymentAmount : "0")
  const { data: ethCost } = useCalculateETHCost(paymentMethod === "eth" ? tokenAmount : "0")
  const { data: usdcCost } = useCalculateUSDCCost(paymentMethod === "usdc" ? tokenAmount : "0")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Parse sale stats
  const tokensSold = saleStats ? formatTokenAmount(saleStats[0]) : "0"
  const remainingSupply = saleStats ? formatTokenAmount(saleStats[1]) : "0"
  const totalBuyers = saleStats ? Number(saleStats[2]) : 0
  const totalRaisedETH = saleStats ? formatETHAmount(saleStats[3]) : "0"
  const totalRaisedUSDC = saleStats ? formatUSDCAmount(saleStats[4]) : "0"

  const userPurchased = formatTokenAmount(purchasedAmount)
  const userRemaining = formatTokenAmount(remainingAllowance)

  const progressPercent = saleStats
    ? Math.round((Number(formatTokenAmount(saleStats[0])) / 1_000_000) * 100)
    : 0

  const handleBuy = async () => {
    if (!isConnected || !tokenAmount || !paymentAmount) return

    try {
      if (paymentMethod === "eth") {
        await buyWithETH(paymentAmount)
      } else {
        if (needsApproval) {
          await approveUSDC(paymentAmount)
          setNeedsApproval(false)
        } else {
          await buyWithUSDC(paymentAmount)
        }
      }
    } catch (error) {
      console.error("Purchase failed:", error)
    }
  }

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value)
    if (value && !isNaN(Number(value))) {
      if (paymentMethod === "eth") {
        const cost = formatETHAmount(ethCost)
        setPaymentAmount(cost)
      } else {
        const cost = formatUSDCAmount(usdcCost)
        setPaymentAmount(cost)
      }
    }
  }

  const handlePaymentAmountChange = (value: string) => {
    setPaymentAmount(value)
    if (value && !isNaN(Number(value))) {
      if (paymentMethod === "eth") {
        const tokens = formatTokenAmount(tokensForETH)
        setTokenAmount(tokens)
      } else {
        const tokens = formatTokenAmount(tokensForUSDC)
        setTokenAmount(tokens)
      }
    }
  }

  const isProcessing = isBuyingETH || isBuyingUSDC || isApproving || isConfirmingETH || isConfirmingUSDC || isConfirmingApproval
  const isSuccess = isSuccessETH || isSuccessUSDC
  const error = errorETH || errorUSDC

  const hasContractOnNetwork = contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000"

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Buy PULSE Tokens</h1>
        <p className="text-muted-foreground">
          Purchase PULSE tokens directly with ETH or USDC
        </p>
      </div>

      {/* Contract Warning */}
      {!hasContractOnNetwork && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            DirectTokenSale contract not deployed on this network. Please switch to Base Sepolia or deploy the contract first.
          </AlertDescription>
        </Alert>
      )}

      {/* Sale Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Tokens Sold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(tokensSold).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">of 1,000,000 PULSE</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Remaining
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(remainingSupply).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">PULSE available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total Buyers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBuyers}</div>
            <p className="text-xs text-muted-foreground">participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-purple-500" />
              Sale Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSaleActive ? "Active" : "Inactive"}
            </div>
            <p className="text-xs text-muted-foreground">{progressPercent}% sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sale Progress</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Purchase Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchase PULSE Tokens</CardTitle>
              <CardDescription>
                Choose your payment method and enter the amount you want to buy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Tabs */}
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "eth" | "usdc")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="eth">Pay with ETH</TabsTrigger>
                  <TabsTrigger value="usdc">Pay with USDC</TabsTrigger>
                </TabsList>

                <TabsContent value="eth" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eth-amount">ETH Amount</Label>
                    <Input
                      id="eth-amount"
                      type="number"
                      placeholder="0.0"
                      value={paymentAmount}
                      onChange={(e) => handlePaymentAmountChange(e.target.value)}
                      disabled={!isConnected || !isSaleActive}
                    />
                    <p className="text-sm text-muted-foreground">
                      1 ETH = 100,000 PULSE (at ~$1000/ETH)
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="usdc" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usdc-amount">USDC Amount</Label>
                    <Input
                      id="usdc-amount"
                      type="number"
                      placeholder="0.0"
                      value={paymentAmount}
                      onChange={(e) => handlePaymentAmountChange(e.target.value)}
                      disabled={!isConnected || !isSaleActive}
                    />
                    <p className="text-sm text-muted-foreground">
                      1 USDC = 100 PULSE (0.01 USDC per PULSE)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Token Amount */}
              <div className="space-y-2">
                <Label htmlFor="token-amount">PULSE Tokens to Receive</Label>
                <Input
                  id="token-amount"
                  type="number"
                  placeholder="0.0"
                  value={tokenAmount}
                  onChange={(e) => handleTokenAmountChange(e.target.value)}
                  disabled={!isConnected || !isSaleActive}
                />
                <p className="text-sm text-muted-foreground">
                  Min: {DIRECT_SALE_CONFIG.minPurchase} PULSE | Max: {userRemaining || DIRECT_SALE_CONFIG.maxPurchasePerWallet} PULSE remaining
                </p>
              </div>

              {/* Success Message */}
              {isSuccess && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Purchase successful! Your PULSE tokens have been transferred to your wallet.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error.message || "Transaction failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Buy Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleBuy}
                disabled={!isConnected || !tokenAmount || !paymentAmount || isProcessing || !isSaleActive}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isApproving || isConfirmingApproval ? "Approving USDC..." : "Processing..."}
                  </>
                ) : !isConnected ? (
                  "Connect Wallet to Buy"
                ) : needsApproval ? (
                  "Approve USDC"
                ) : (
                  `Buy ${tokenAmount || "0"} PULSE`
                )}
              </Button>

              {paymentMethod === "usdc" && !needsApproval && (
                <p className="text-xs text-muted-foreground text-center">
                  You may need to approve USDC spending before purchasing
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Stats & Info */}
        <div className="space-y-4">
          {/* Your Purchase Stats */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Purchased</p>
                  <p className="text-2xl font-bold">{Number(userPurchased).toLocaleString()} PULSE</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Allowance</p>
                  <p className="text-2xl font-bold">{Number(userRemaining).toLocaleString()} PULSE</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Info */}
          <Card>
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">{DIRECT_SALE_CONFIG.tokenPrice} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Purchase</span>
                <span className="font-semibold">{DIRECT_SALE_CONFIG.minPurchase} PULSE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Per Wallet</span>
                <span className="font-semibold">{DIRECT_SALE_CONFIG.maxPurchasePerWallet} PULSE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-semibold">{DIRECT_SALE_CONFIG.totalSupply} PULSE</span>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Connect your wallet</li>
                <li>Choose payment method (ETH or USDC)</li>
                <li>Enter amount you want to buy</li>
                <li>Approve USDC if paying with USDC</li>
                <li>Confirm transaction</li>
                <li>Receive PULSE tokens instantly</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
