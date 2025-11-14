"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import {
  useActivePolls,
  usePoll,
  useClosePoll,
  useFundPollWithETH,
  useSetDistributionMode,
  useWithdrawFunds,
  useDistributeRewards,
} from "@/lib/contracts/polls-contract-utils"
import { toast } from "sonner"
import { formatEther } from "viem"
import { DashboardStats } from "@/components/creator/dashboard-stats"
import { ResponsesOverviewChart } from "@/components/creator/responses-overview-chart"
import { ResponsesTimelineChart } from "@/components/creator/responses-timeline-chart"
import { ManagePollsTab } from "@/components/creator/manage-polls-tab"
import { DistributionsTab } from "@/components/creator/distributions-tab"
import { fetchAnalyticsTrends, fetchPollDistributions } from "@/lib/api/analytics"

export default function CreatorPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") || "dashboard"

  const [fundAmount, setFundAmount] = useState("")
  const [selectedPollId, setSelectedPollId] = useState<bigint | null>(null)
  const [selectedCoin, setSelectedCoin] = useState("ETH")
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [timelineDays, setTimelineDays] = useState(7)
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)
  const [distributions, setDistributions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(tabParam)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: activePollIds, isLoading: pollsLoading } = useActivePolls()
  const { closePoll, isPending: isClosing } = useClosePoll()
  const { fundPoll, isPending: isFunding } = useFundPollWithETH()
  const { setDistributionMode, isPending: isSettingMode } = useSetDistributionMode()
  const { withdrawFunds, isPending: isWithdrawing } = useWithdrawFunds()
  const { distributeRewards, isPending: isDistributing } = useDistributeRewards()

  const supportedAssets = [
    { coin: "BTC", network: "bitcoin", name: "Bitcoin" },
    { coin: "ETH", network: "ethereum", name: "Ethereum" },
    { coin: "USDT", network: "ethereum", name: "USDT (Ethereum)" },
    { coin: "USDT", network: "polygon", name: "USDT (Polygon)" },
    { coin: "USDC", network: "ethereum", name: "USDC (Ethereum)" },
    { coin: "USDC", network: "polygon", name: "USDC (Polygon)" },
    { coin: "LTC", network: "litecoin", name: "Litecoin" },
    { coin: "DOGE", network: "dogecoin", name: "Dogecoin" },
    { coin: "ADA", network: "cardano", name: "Cardano" },
    { coin: "DOT", network: "polkadot", name: "Polkadot" },
  ]

  // Fetch all polls (we'll get up to 10 to have more data)
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
          options: options.map((option: string, idx: number) => ({
            text: option,
            votes: votes[idx],
          })),
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

  // Calculate responses overview data
  const responsesOverviewData = useMemo(() => {
    const optionVotes: { [key: string]: number } = {}

    myPolls.forEach((poll) => {
      if (poll.isActive) {
        poll.options.forEach((option) => {
          const optionText = option.text.slice(0, 20) // Truncate long options
          optionVotes[optionText] = (optionVotes[optionText] || 0) + Number(option.votes)
        })
      }
    })

    return Object.entries(optionVotes)
      .map(([option, responses]) => ({ option, responses }))
      .slice(0, 10) // Top 10 options
  }, [myPolls])

  // Fetch timeline data
  useEffect(() => {
    const loadTrends = async () => {
      setIsLoadingTrends(true)
      try {
        const trends = await fetchAnalyticsTrends(chainId, timelineDays)

        // Transform data for chart
        const chartData = trends.dailyData.map((day) => ({
          date: day.date,
          responses: day.distributionCount,
          cumulative: trends.dailyData
            .filter((d) => d.date <= day.date)
            .reduce((sum, d) => sum + d.distributionCount, 0),
        }))

        setTimelineData(chartData)
      } catch (error) {
        console.error("Failed to load trends:", error)
        setTimelineData([])
      } finally {
        setIsLoadingTrends(false)
      }
    }

    if (isConnected) {
      loadTrends()
    }
  }, [chainId, timelineDays, isConnected])

  const handleClosePoll = async (pollId: bigint) => {
    try {
      await closePoll(Number(pollId))
      toast.success("Poll close transaction submitted")
    } catch (error) {
      console.error("Close poll failed:", error)
      toast.error("Failed to close poll")
    }
  }

  const handleFundPoll = async () => {
    if (!fundAmount || !selectedPollId) return

    try {
      if (selectedCoin === "ETH" && selectedNetwork === "ethereum") {
        // Direct ETH funding
        await fundPoll(Number(selectedPollId), fundAmount)
        toast.success("Poll funding transaction submitted")
        setIsFundDialogOpen(false)
      } else {
        // SideShift conversion + funding
        await handleSideShiftConversion()
      }

      setFundAmount("")
      setSelectedPollId(null)
      setSelectedCoin("ETH")
      setSelectedNetwork("ethereum")
    } catch (error) {
      console.error("Fund poll failed:", error)
      toast.error("Failed to fund poll")
    }
  }

  const openFundDialog = (pollId: bigint) => {
    setSelectedPollId(pollId)
    setIsFundDialogOpen(true)
  }

  const handleSideShiftConversion = async () => {
    try {
      // Create SideShift shift directly - they handle the swap
      const shiftResponse = await fetch('https://sideshift.ai/api/v1/shifts/fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositCoin: selectedCoin.toLowerCase(),
          settleCoin: 'eth',
          depositAmount: fundAmount,
          settleAddress: address,
          affiliateId: 'basepulse'
        })
      })

      const shift = await shiftResponse.json()

      if (!shiftResponse.ok) {
        throw new Error(shift.error?.message || 'Failed to create shift')
      }

      // Show user the deposit address
      toast.success(`Send ${fundAmount} ${selectedCoin} to: ${shift.depositAddress}`)

      // Copy deposit address to clipboard
      navigator.clipboard.writeText(shift.depositAddress)
      toast.info("Deposit address copied to clipboard!")

    } catch (error) {
      console.error("SideShift conversion failed:", error)
      toast.error(`Conversion failed: ${error.message}`)
    }
  }

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

  // Prepare polls data for manage tab
  const managePollsData = useMemo(() => {
    return myPolls.map(poll => ({
      ...poll,
      distributionMode: 0 as 0 | 1 | 2, // Default to MANUAL_PULL
      balances: [], // TODO: Fetch token balances
      voters: [], // TODO: Fetch voters
    }))
  }, [myPolls])

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
              Please connect your wallet to view your creator dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard for Creator</h1>
          <p className="text-muted-foreground">
            Analytics and management for your polls
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="manage">Manage Polls</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats
              totalPolls={dashboardStats.totalPolls}
              totalResponses={dashboardStats.totalResponses}
              activePolls={dashboardStats.activePolls}
              totalFunded={dashboardStats.totalFunded}
              isLoading={pollsLoading}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ResponsesOverviewChart
                data={responsesOverviewData}
                isLoading={pollsLoading}
              />
              <ResponsesTimelineChart
                data={timelineData}
                isLoading={isLoadingTrends}
                onTimeRangeChange={setTimelineDays}
              />
            </div>
          </TabsContent>

          {/* Manage Polls Tab */}
          <TabsContent value="manage">
            <ManagePollsTab
              polls={managePollsData}
              isLoading={pollsLoading}
              onSetDistributionMode={handleSetDistributionMode}
              onWithdrawFunds={handleWithdrawFunds}
              onDistributeRewards={handleDistributeRewards}
              onClosePoll={handleClosePoll}
            />
          </TabsContent>

          {/* Distributions Tab */}
          <TabsContent value="distributions">
            <DistributionsTab
              distributions={distributions}
              isLoading={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
