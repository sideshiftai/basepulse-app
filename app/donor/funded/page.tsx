/**
 * Donor Funded Polls Page
 * View and manage polls the donor has funded
 */

"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId } from "wagmi"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Coins,
  Clock,
  Users,
  Wallet,
  CheckCircle2,
  XCircle,
  ExternalLink,
  TrendingUp,
  Calendar,
  ArrowRight,
} from "lucide-react"
import { DonorBreadcrumb } from "@/components/donor/donor-breadcrumb"
import { CreatorHeaderBanner } from "@/components/creator/creator-header-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRewardDisplay } from "@/lib/utils/format-reward"

interface FundedPoll {
  id: string
  title: string
  status: "active" | "ended" | "cancelled"
  fundedAmount: string
  fundingToken: string
  totalReward: string
  fundingProgress: number
  totalVotes: number
  endsAt: string
  fundedAt: string
  txHash: string
}

export default function DonorFundedPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const router = useRouter()

  const [fundedPolls, setFundedPolls] = useState<FundedPoll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // Mock data loading - In production, fetch from API/subgraph
  useEffect(() => {
    async function loadFundedPolls() {
      if (!address || !chainId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // TODO: Replace with actual API call
        // const polls = await fetchFundedPollsByDonor(address, chainId)

        // Mock data for now
        setTimeout(() => {
          setFundedPolls([
            {
              id: "1",
              title: "Should we implement a new governance model?",
              status: "active",
              fundedAmount: "0.5",
              fundingToken: "ETH",
              totalReward: "2.0",
              fundingProgress: 75,
              totalVotes: 234,
              endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              fundedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              txHash: "0x1234...5678",
            },
            {
              id: "2",
              title: "Community treasury allocation proposal",
              status: "active",
              fundedAmount: "100",
              fundingToken: "USDC",
              totalReward: "500",
              fundingProgress: 60,
              totalVotes: 156,
              endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              fundedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              txHash: "0xabcd...ef01",
            },
            {
              id: "3",
              title: "New feature priority voting",
              status: "ended",
              fundedAmount: "0.25",
              fundingToken: "ETH",
              totalReward: "1.0",
              fundingProgress: 100,
              totalVotes: 512,
              endsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              fundedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              txHash: "0x9876...5432",
            },
          ])
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error loading funded polls:", error)
        setIsLoading(false)
      }
    }

    loadFundedPolls()
  }, [address, chainId])

  // Filter polls by tab
  const filteredPolls = fundedPolls.filter((poll) => {
    if (activeTab === "all") return true
    return poll.status === activeTab
  })

  // Calculate stats
  const stats = {
    totalFunded: fundedPolls.reduce((sum, p) => sum + parseFloat(p.fundedAmount), 0),
    activePolls: fundedPolls.filter((p) => p.status === "active").length,
    completedPolls: fundedPolls.filter((p) => p.status === "ended").length,
  }

  // Show wallet connection warning if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <DonorBreadcrumb />
          <div className="flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <p className="text-sm">
              Please connect your wallet to view your funded polls
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case "ended":
        return <Badge variant="secondary">Ended</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4 text-green-500" />
      case "ended":
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <DonorBreadcrumb />

        {/* Header Banner */}
        <CreatorHeaderBanner
          title="Funded Polls"
          description="View and manage polls you've funded"
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Funded</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.totalFunded.toFixed(2)} ETH</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Polls</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.activePolls}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.completedPolls}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({fundedPolls.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({fundedPolls.filter((p) => p.status === "active").length})
            </TabsTrigger>
            <TabsTrigger value="ended">
              Ended ({fundedPolls.filter((p) => p.status === "ended").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredPolls.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No funded polls</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't funded any polls yet
                  </p>
                  <Button onClick={() => router.push("/donor/explore")}>
                    Explore Polls to Fund
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPolls.map((poll) => (
                  <Card key={poll.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Poll Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(poll.status)}
                            {getStatusBadge(poll.status)}
                          </div>
                          <h3 className="text-lg font-semibold">{poll.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4" />
                              <span>
                                You funded: <strong className="text-foreground">{poll.fundedAmount} {poll.fundingToken}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{poll.totalVotes} votes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {poll.status === "active"
                                  ? `Ends ${new Date(poll.endsAt).toLocaleDateString()}`
                                  : `Ended ${new Date(poll.endsAt).toLocaleDateString()}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Funding Progress */}
                        <div className="w-full md:w-48 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Funded</span>
                            <span className="font-medium">{poll.fundingProgress}%</span>
                          </div>
                          <Progress value={poll.fundingProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-center">
                            {poll.totalReward} {poll.fundingToken} goal
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dapp/poll/${poll.id}`)}
                          >
                            View Poll
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
