/**
 * Manage Polls Page
 * Dedicated page for managing all creator's polls
 */

"use client"

import { useState, useMemo } from "react"
import { useAccount } from "wagmi"
import { AlertCircle } from "lucide-react"
import {
  useActivePolls,
  usePoll,
  useClosePoll,
  useSetDistributionMode,
  useWithdrawFunds,
  useDistributeRewards,
} from "@/lib/contracts/polls-contract-utils"
import { toast } from "sonner"
import { ManagePollsTab } from "@/components/creator/manage-polls-tab"
import { CreatorBreadcrumb } from "@/components/creator/creator-breadcrumb"

export default function ManagePollsPage() {
  const { address, isConnected } = useAccount()
  const { data: activePollIds, isLoading: pollsLoading } = useActivePolls()
  const { closePoll } = useClosePoll()
  const { setDistributionMode } = useSetDistributionMode()
  const { withdrawFunds } = useWithdrawFunds()
  const { distributeRewards } = useDistributeRewards()

  // Fetch all polls (up to 10)
  const pollQueries = Array.from({ length: 10 }, (_, i) =>
    usePoll(activePollIds?.[i] ? Number(activePollIds[i]) : 0)
  )

  // Filter and format polls created by current user
  const myPolls = useMemo(() => {
    if (!activePollIds || !address) return []

    return activePollIds
      .slice(0, 10)
      .map((pollId: bigint, index: number) => {
        const pollData = pollQueries[index]
        if (!pollData.data) return null

        const [id, question, options, votes, endTime, isActive, creator, totalFunding] = pollData.data

        // Only include polls created by current user
        if (creator.toLowerCase() !== address.toLowerCase()) return null

        return {
          id,
          question,
          isActive,
          totalVotes: votes.reduce((sum: bigint, vote: bigint) => sum + vote, BigInt(0)),
          totalFunding,
          endTime,
          distributionMode: 0 as 0 | 1 | 2, // Default to MANUAL_PULL
          balances: [], // TODO: Fetch token balances
          voters: [], // TODO: Fetch voters
        }
      })
      .filter(Boolean)
  }, [activePollIds, address, pollQueries])

  const handleSetDistributionMode = async (pollId: bigint, mode: number) => {
    try {
      await setDistributionMode(Number(pollId), mode)
      toast.success("Distribution mode update transaction submitted")
    } catch (error) {
      console.error("Set distribution mode failed:", error)
      toast.error("Failed to update distribution mode")
    }
  }

  const handleWithdrawFunds = async (pollId: bigint, recipient: string, tokens: string[]) => {
    try {
      await withdrawFunds(Number(pollId), recipient as `0x${string}`, tokens as `0x${string}`[])
      toast.success("Withdraw funds transaction submitted")
    } catch (error) {
      console.error("Withdraw funds failed:", error)
      toast.error("Failed to withdraw funds")
    }
  }

  const handleDistributeRewards = async (
    pollId: bigint,
    token: string,
    recipients: string[],
    amounts: string[]
  ) => {
    try {
      const amountsBigInt = amounts.map(a => BigInt(a))
      await distributeRewards(
        Number(pollId),
        token as `0x${string}`,
        recipients as `0x${string}`[],
        amountsBigInt
      )
      toast.success("Distribute rewards transaction submitted")
    } catch (error) {
      console.error("Distribute rewards failed:", error)
      toast.error("Failed to distribute rewards")
    }
  }

  const handleClosePoll = async (pollId: bigint) => {
    try {
      await closePoll(Number(pollId))
      toast.success("Poll close transaction submitted")
    } catch (error) {
      console.error("Close poll failed:", error)
      toast.error("Failed to close poll")
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-amber-700 dark:text-amber-300">
              Please connect your wallet to manage your polls.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <CreatorBreadcrumb />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Manage Polls</h1>
          <p className="text-muted-foreground">
            Manage distribution modes, withdraw funds, and distribute rewards
          </p>
        </div>

        <ManagePollsTab
          polls={myPolls}
          isLoading={pollsLoading}
          onSetDistributionMode={handleSetDistributionMode}
          onWithdrawFunds={handleWithdrawFunds}
          onDistributeRewards={handleDistributeRewards}
          onClosePoll={handleClosePoll}
        />
      </div>
    </div>
  )
}
