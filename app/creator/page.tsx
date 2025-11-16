"use client"

import { useState, useEffect, useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { useActivePolls, usePoll } from "@/lib/contracts/polls-contract-utils"
import { formatEther } from "viem"
import { DashboardStats } from "@/components/creator/dashboard-stats"
import { ResponsesOverviewChart } from "@/components/creator/responses-overview-chart"
import { ResponsesTimelineChart } from "@/components/creator/responses-timeline-chart"
import { fetchAnalyticsTrends } from "@/lib/api/analytics"

export default function CreatorPage() {
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [timelineDays, setTimelineDays] = useState(7)
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: activePollIds, isLoading: pollsLoading } = useActivePolls()

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
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your polls
          </p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats
          totalPolls={dashboardStats.totalPolls}
          totalResponses={dashboardStats.totalResponses}
          activePolls={dashboardStats.activePolls}
          totalFunded={dashboardStats.totalFunded}
          isLoading={pollsLoading}
        />

        {/* Charts Row */}
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
      </div>
    </div>
  )
}
