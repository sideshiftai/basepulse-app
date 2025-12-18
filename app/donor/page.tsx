/**
 * Donor Dashboard Page
 * Main page for donors to explore polls to fund and manage their funding
 */

"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId } from "wagmi"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Coins,
  TrendingUp,
  Target,
  ChevronRight,
  Clock,
  Users,
  Wallet,
  Search,
  ArrowRight,
} from "lucide-react"
import { DonorBreadcrumb } from "@/components/donor/donor-breadcrumb"
import { CreatorHeaderBanner } from "@/components/creator/creator-header-banner"
import { DonorStats } from "@/components/donor/donor-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { usePollsData } from "@/hooks/use-polls-data"
import { formatRewardDisplay } from "@/lib/utils/format-reward"

export default function DonorPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const router = useRouter()

  const [stats, setStats] = useState({
    totalFunded: "0.00 ETH",
    pollsFunded: 0,
    activeFunding: 0,
    impactScore: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch polls that need funding (active polls with funding enabled)
  const { polls: availablePolls, loading: pollsLoading } = usePollsData({ pageSize: 6 })

  // Filter polls that are active and have funding enabled
  const pollsNeedingFunding = availablePolls
    .filter((poll) => poll.status === "active" && poll.fundingType !== "none")
    .slice(0, 6)

  // Mock data loading - In production, this would fetch from API
  useEffect(() => {
    async function loadDonorData() {
      if (!address || !chainId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // TODO: Replace with actual API calls
        // const donorStats = await fetchDonorStats(address, chainId)
        // setStats(donorStats)

        // Mock data for now
        setTimeout(() => {
          setStats({
            totalFunded: "2.5 ETH",
            pollsFunded: 12,
            activeFunding: 5,
            impactScore: 847,
          })
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error loading donor data:", error)
        setIsLoading(false)
      }
    }

    loadDonorData()
  }, [address, chainId])

  // Show wallet connection warning if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <DonorBreadcrumb />

          <div className="flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <p className="text-sm">
              Please connect your wallet to access donor features
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
        <DonorBreadcrumb />

        {/* Header Banner */}
        <CreatorHeaderBanner
          title="Donor Dashboard"
          description="Explore polls to fund and track your impact on the community"
        />

        {/* Stats */}
        <DonorStats
          totalFunded={stats.totalFunded}
          pollsFunded={stats.pollsFunded}
          activeFunding={stats.activeFunding}
          impactScore={stats.impactScore}
          isLoading={isLoading}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => router.push("/donor/explore")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Explore Polls</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Discover polls that need funding and support causes you care about
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => router.push("/donor/funded")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Wallet className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-lg">Funded Polls</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View and manage polls you've funded and track their progress
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => router.push("/donor/trending")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <CardTitle className="text-lg">Trending Polls</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                See the most popular polls attracting community attention
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Polls Needing Funding Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Polls Seeking Funding
              </h2>
              <p className="text-sm text-muted-foreground">
                Support these polls and help drive community decisions
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/donor/explore")}>
              Explore All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {pollsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : pollsNeedingFunding.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No polls seeking funding at the moment</p>
                <Button variant="link" onClick={() => router.push("/dapp")}>
                  Browse all polls
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pollsNeedingFunding.map((poll) => {
                // Calculate funding progress (mock data for now)
                const fundingGoal = Number(poll.totalReward) * 2 || 1000000000000000000n // 1 ETH in wei
                const currentFunding = Number(poll.totalReward) || 0
                const fundingProgress = Math.min((currentFunding / Number(fundingGoal)) * 100, 100)

                return (
                  <Card
                    key={poll.id}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                    onClick={() => router.push(`/dapp/poll/${poll.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="text-xs">
                          {poll.fundingType === "crowdfund" ? "Crowdfunding" : "Community"}
                        </Badge>
                        <div className="flex items-center gap-1 text-green-500">
                          <Coins className="w-3 h-3" />
                          <span className="font-bold text-xs">
                            {formatRewardDisplay(poll.totalReward, poll.fundingToken)}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 mt-2">{poll.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Funding Progress</span>
                            <span className="font-medium">{Math.round(fundingProgress)}%</span>
                          </div>
                          <Progress value={fundingProgress} className="h-2" />
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{poll.totalVotes} votes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(poll.endsAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Click to fund</span>
                          <ChevronRight className="w-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Impact Summary Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Impact
            </CardTitle>
            <CardDescription>
              See how your funding is making a difference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Polls Supported</p>
                <p className="text-3xl font-bold text-primary">{stats.pollsFunded}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Community Members Reached</p>
                <p className="text-3xl font-bold text-green-500">
                  {(stats.pollsFunded * 127).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Impact Score</p>
                <p className="text-3xl font-bold text-amber-500">{stats.impactScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
