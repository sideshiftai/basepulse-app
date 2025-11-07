"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId } from "wagmi"
import { Address, formatUnits, parseUnits } from "viem"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  useFundPollWithToken,
  useTokenApproval,
  useTokenBalance,
  useTokenAllowance,
  usePollsContractAddress,
} from "@/lib/contracts/polls-contract-utils"
import {
  getSupportedTokens,
  getTokenInfo,
  TOKEN_INFO,
} from "@/lib/contracts/token-config"

interface FundWithTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pollId: number
  pollTitle: string
}

export function FundWithTokenDialog({
  open,
  onOpenChange,
  pollId,
  pollTitle,
}: FundWithTokenDialogProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const pollsContractAddress = usePollsContractAddress()

  // State
  const [selectedToken, setSelectedToken] = useState<string>("PULSE")
  const [amount, setAmount] = useState<string>("")
  const [step, setStep] = useState<"input" | "approve" | "fund">("input")

  // Get supported tokens for current chain
  const supportedTokens = getSupportedTokens(chainId)
  const selectedTokenAddress = supportedTokens[selectedToken] as Address
  const tokenInfo = getTokenInfo(selectedToken)

  // Hooks
  const { fundPoll, isPending: isFunding, isSuccess: isFundSuccess } = useFundPollWithToken()
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess } = useTokenApproval()

  const { data: balance } = useTokenBalance(selectedTokenAddress, address)
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(
    selectedTokenAddress,
    address,
    pollsContractAddress
  )

  // Format balance for display
  const formattedBalance = balance && tokenInfo
    ? formatUnits(balance, tokenInfo.decimals)
    : "0"

  // Check if user has sufficient balance
  const hasInsufficientBalance = () => {
    if (!amount || !balance || !tokenInfo) return false
    try {
      const amountBigInt = parseUnits(amount, tokenInfo.decimals)
      return amountBigInt > balance
    } catch {
      return false
    }
  }

  // Check if approval is needed
  const needsApproval = () => {
    if (!amount || !allowance || !tokenInfo) return true
    try {
      const amountBigInt = parseUnits(amount, tokenInfo.decimals)
      return amountBigInt > allowance
    } catch {
      return true
    }
  }

  // Handle approve
  const handleApprove = async () => {
    if (!selectedTokenAddress || !pollsContractAddress || !tokenInfo || !amount) return

    try {
      setStep("approve")
      await approve(selectedTokenAddress, pollsContractAddress, amount, tokenInfo.decimals)
      toast.success("Token approval successful!")
    } catch (error: any) {
      console.error("Approval error:", error)
      toast.error(error.message || "Failed to approve token")
      setStep("input")
    }
  }

  // Handle fund
  const handleFund = async () => {
    if (!selectedTokenAddress || !tokenInfo || !amount) return

    try {
      setStep("fund")
      await fundPoll(pollId, selectedTokenAddress, amount, tokenInfo.decimals)
      toast.success("Poll funded successfully!")
    } catch (error: any) {
      console.error("Funding error:", error)
      toast.error(error.message || "Failed to fund poll")
      setStep("input")
    }
  }

  // Handle submit
  const handleSubmit = async () => {
    if (needsApproval()) {
      await handleApprove()
    } else {
      await handleFund()
    }
  }

  // Reset when approval succeeds
  useEffect(() => {
    if (isApproveSuccess && step === "approve") {
      refetchAllowance()
      toast.success("Ready to fund poll!")
      setStep("input")
    }
  }, [isApproveSuccess, step, refetchAllowance])

  // Reset when funding succeeds
  useEffect(() => {
    if (isFundSuccess && step === "fund") {
      setAmount("")
      setStep("input")
      onOpenChange(false)
    }
  }, [isFundSuccess, step, onOpenChange])

  // Filter out ETH from tokens (we have separate ETH funding)
  const tokenOptions = Object.keys(supportedTokens).filter(symbol => symbol !== "ETH")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fund Poll with Tokens</DialogTitle>
          <DialogDescription>
            Support "{pollTitle}" with your tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger id="token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokenOptions.map((symbol) => {
                  const info = TOKEN_INFO[symbol]
                  return (
                    <SelectItem key={symbol} value={symbol}>
                      <div className="flex items-center gap-2">
                        <span>{info?.symbol || symbol}</span>
                        <span className="text-xs text-muted-foreground">
                          {info?.name || ""}
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {address && (
              <p className="text-xs text-muted-foreground">
                Balance: {parseFloat(formattedBalance).toLocaleString(undefined, {
                  maximumFractionDigits: 6
                })} {selectedToken}
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                min="0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(formattedBalance)}
              >
                Max
              </Button>
            </div>
            {hasInsufficientBalance() && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Insufficient balance
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            {step === "input" && needsApproval() && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                You need to approve {selectedToken} spending first
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                hasInsufficientBalance() ||
                isApproving ||
                isFunding
              }
              className="w-full"
            >
              {(isApproving || isFunding) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isApproving && "Approving..."}
              {isFunding && "Funding..."}
              {!isApproving && !isFunding && needsApproval() && `Approve ${selectedToken}`}
              {!isApproving && !isFunding && !needsApproval() && "Fund Poll"}
            </Button>

            {isApproveSuccess && step === "input" && !needsApproval() && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 justify-center">
                <Check className="h-3 w-3" />
                Approval confirmed! Ready to fund.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
