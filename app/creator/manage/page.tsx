/**
 * Manage Polls Page
 * Dedicated page for managing all creator's polls
 */

"use client"

import { useState, useMemo, useEffect } from "react"
import { useAccount } from "wagmi"
import { AlertCircle, Plus, LayoutGrid, Table } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatEther } from "viem"
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
import { CreatorHeaderBanner } from "@/components/creator/creator-header-banner"
import { DashboardStats } from "@/components/creator/dashboard-stats"
import { PollCard } from "@/components/creator/poll-card"
import { Button } from "@/components/ui/button"

export default function ManagePollsPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { data: activePollIds, isLoading: pollsLoading } = useActivePolls()
  const { closePoll } = useClosePoll()
  const { setDistributionMode } = useSetDistributionMode()
  const { withdrawFunds } = useWithdrawFunds()
  const { distributeRewards } = useDistributeRewards()

  // View toggle state with localStorage persistence
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards")

  useEffect(() => {
    const stored = localStorage.getItem("manage-polls-view")
    if (stored === "table" || stored === "cards") {
      setViewMode(stored)
    }
  }, [])

  const toggleView = (mode: "table" | "cards") => {
    setViewMode(mode)
    localStorage.setItem("manage-polls-view", mode)
  }

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

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const totalPolls = myPolls.length
    const activePolls = myPolls.filter((p) => p.isActive).length
    const totalResponses = myPolls.reduce(
      (sum, poll) => sum + Number(poll.totalVotes),
      0
    )
    const totalFunded = myPolls.reduce(
      (sum, poll) => sum + Number(formatEther(poll.totalFunding)),
      0
    )

    return {
      totalPolls,
      activePolls,
      totalResponses,
      totalFunded: `${totalFunded.toFixed(4)} ETH`,
    }
  }, [myPolls])

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

        {/* Header Banner */}
        <CreatorHeaderBanner
          title="Manage Polls"
          description="Manage your polls and track their performance"
        />

        {/* Stats */}
        <DashboardStats
          totalPolls={dashboardStats.totalPolls}
          totalResponses={dashboardStats.totalResponses}
          activePolls={dashboardStats.activePolls}
          totalFunded={dashboardStats.totalFunded}
          isLoading={pollsLoading}
        />

        {/* My Polls Section with View Toggle and New Poll Button */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Polls</h2>
              <p className="text-sm text-muted-foreground">
                Manage your polls and track their performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => toggleView("cards")}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => toggleView("table")}
                  className="rounded-l-none"
                >
                  <Table className="h-4 w-4 mr-2" />
                  Table
                </Button>
              </div>

              {/* New Poll Button */}
              <Button onClick={() => router.push("/dapp/create")}>
                <Plus className="h-4 w-4 mr-2" />
                New Poll
              </Button>
            </div>
          </div>

          {/* Conditional Rendering: Cards or Table */}
          {viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {myPolls.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  No polls found. Create your first poll to get started.
                </div>
              ) : (
                myPolls.map((poll) => (
                  <PollCard
                    key={Number(poll.id)}
                    poll={poll}
                    onClosePoll={handleClosePoll}
                    onSetDistributionMode={handleSetDistributionMode}
                  />
                ))
              )}
            </div>
          ) : (
            <ManagePollsTab
              polls={myPolls}
              isLoading={pollsLoading}
              onSetDistributionMode={handleSetDistributionMode}
              onWithdrawFunds={handleWithdrawFunds}
              onDistributeRewards={handleDistributeRewards}
              onClosePoll={handleClosePoll}
            />
          )}
        </div>
      </div>
    </div>
  )
}
