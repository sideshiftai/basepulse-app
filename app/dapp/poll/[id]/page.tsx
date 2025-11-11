"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Clock, Users, Coins, TrendingUp, Award } from "lucide-react"
import { usePollData } from "@/hooks/use-poll-data"
import { usePollFundingsData } from "@/hooks/use-poll-fundings-data"
import { useDataSource } from "@/hooks/use-data-source"
import { useHasUserVoted, usePollsContractAddress } from "@/lib/contracts/polls-contract-utils"
import { useAccount, useChainId } from "wagmi"
import { ClaimRewardsDialog } from "@/components/sideshift/claim-rewards-dialog"
import { FundingHistory } from "@/components/poll/funding-history"

interface PageProps {
  params: { id: string }
}

export default function PollDetailPage({ params }: PageProps) {
  const router = useRouter()
  const pollId = parseInt(params.id)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)

  // Use unified data hooks
  const { dataSource, isSubgraph } = useDataSource()
  const { poll, loading: pollLoading, error: pollError } = usePollData(pollId)
  const { fundings, totalFunding, loading: fundingsLoading } = usePollFundingsData(pollId)
  const contractAddress = usePollsContractAddress()
  const { data: hasVoted } = useHasUserVoted(pollId, address)

  const isLoading = pollLoading
  const error = pollError

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading poll...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Poll Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || "This poll doesn't exist or failed to load."}
          </p>
          <Button onClick={() => router.push('/dapp')}>Back to Polls</Button>
        </div>
      </div>
    )
  }

  // Calculate poll stats from formatted poll
  const totalVotes = poll.totalVotes
  const timeRemaining = new Date(poll.endsAt).getTime() - new Date().getTime()
  const hasEnded = timeRemaining <= 0 || poll.status === 'ended'
  const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)))
  const totalReward = poll.totalReward

  // Calculate user's potential reward (simplified - winner takes all for now)
  const userReward = hasEnded && hasVoted && totalReward > 0 ? totalReward / totalVotes : 0

  // Format options with winning status
  const formattedOptions = poll.options.map((option) => {
    const maxVotes = Math.max(...poll.options.map(o => o.votes))
    const isWinning = option.votes === maxVotes && option.votes > 0

    return {
      ...option,
      isWinning,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dapp')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Polls
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{poll.creator.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{poll.creator.slice(0, 8)}...{poll.creator.slice(-6)}</span>
              </div>
              <Badge variant={hasEnded ? "destructive" : "default"}>
                {hasEnded ? "Ended" : "Active"}
              </Badge>
              {hasVoted && <Badge variant="secondary">You Voted</Badge>}
              <Badge variant="outline">{isSubgraph ? "Subgraph" : "Contract"}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Poll Options */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formattedOptions.map((option) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.text}</span>
                      {option.isWinning && totalVotes > 0 && (
                        <Award className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                      </span>
                      <span className="text-sm font-semibold min-w-[3rem] text-right">
                        {option.percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={option.percentage}
                    className="h-3"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reward Claim Section */}
          {hasEnded && hasVoted && totalReward > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Claim Your Rewards
                </CardTitle>
                <CardDescription>
                  This poll has ended. You're eligible to claim rewards!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                    <span className="text-muted-foreground">Your Estimated Reward</span>
                    <span className="text-2xl font-bold text-primary">
                      {userReward.toFixed(6)} ETH
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Convert your ETH rewards to any cryptocurrency using SideShift.ai
                  </p>
                  <Button
                    onClick={() => setClaimDialogOpen(true)}
                    className="w-full"
                    size="lg"
                    disabled={!isConnected}
                  >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Claim Rewards
                  </Button>
                  {!isConnected && (
                    <p className="text-xs text-center text-muted-foreground">
                      Connect your wallet to claim rewards
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funding History */}
          {chainId && (
            <FundingHistory chainId={chainId} pollId={pollId.toString()} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Poll Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Votes</span>
                </div>
                <span className="font-semibold">{totalVotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm">Total Funding</span>
                </div>
                <span className="font-semibold">{totalReward.toFixed(4)} ETH</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Time Remaining</span>
                </div>
                <span className="font-semibold">
                  {hasEnded ? 'Ended' : `${daysRemaining}d`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contract Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Poll ID</p>
                <p className="text-sm font-mono">#{poll.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data Source</p>
                <p className="text-sm">{isSubgraph ? 'The Graph Subgraph' : 'Smart Contract'}</p>
              </div>
              {!isSubgraph && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contract</p>
                  <p className="text-sm font-mono break-all">{contractAddress}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">End Time</p>
                <p className="text-sm">
                  {new Date(poll.endsAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Claim Rewards Dialog */}
      <ClaimRewardsDialog
        pollId={pollId.toString()}
        rewardAmount={userReward.toFixed(6)}
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        onSuccess={() => {
          // Optionally refresh poll data or show success message
        }}
      />
    </div>
  )
}
