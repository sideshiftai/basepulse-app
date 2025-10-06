"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PollCard } from "@/components/poll-card"
import { PollFilters } from "@/components/poll-filters"
import { Plus, TrendingUp, Clock, Users, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useActivePolls, useNextPollId, usePoll, useVote, useHasUserVoted } from "@/lib/contracts/polls-contract-utils"
import { useAccount } from "wagmi"

export default function DappPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "All Status",
    category: "All Categories",
    fundingType: "All Funding",
    sortBy: "Latest",
  })

  const { isConnected, address } = useAccount()
  const { data: activePollIds, isLoading: pollsLoading, error: pollsError } = useActivePolls()
  const { data: nextPollId, isLoading: nextIdLoading } = useNextPollId()
  const { vote, isPending: isVoting } = useVote()

  // Get poll data for each active poll ID (hooks must be called unconditionally)
  const pollQueries = [
    usePoll(activePollIds?.[0] ? Number(activePollIds[0]) : 0),
    usePoll(activePollIds?.[1] ? Number(activePollIds[1]) : 0),
    usePoll(activePollIds?.[2] ? Number(activePollIds[2]) : 0),
    usePoll(activePollIds?.[3] ? Number(activePollIds[3]) : 0),
    usePoll(activePollIds?.[4] ? Number(activePollIds[4]) : 0),
  ]

  // Check voting status for each poll
  const votingStatusQueries = [
    useHasUserVoted(activePollIds?.[0] ? Number(activePollIds[0]) : 0, address),
    useHasUserVoted(activePollIds?.[1] ? Number(activePollIds[1]) : 0, address),
    useHasUserVoted(activePollIds?.[2] ? Number(activePollIds[2]) : 0, address),
    useHasUserVoted(activePollIds?.[3] ? Number(activePollIds[3]) : 0, address),
    useHasUserVoted(activePollIds?.[4] ? Number(activePollIds[4]) : 0, address),
  ]

  // Parse contract polls
  const contractPolls = activePollIds?.slice(0, 5).map((pollId: bigint, index: number) => {
    const pollData = pollQueries[index]
    if (!pollData.data) return null
    
    const [id, question, options, votes, endTime, isActive, creator, totalFunding] = pollData.data
    
    return {
      id: id.toString(),
      title: question,
      description: `Poll created by ${creator}`,
      creator: creator,
      createdAt: new Date().toISOString(),
      endsAt: new Date(Number(endTime) * 1000).toISOString(),
      totalVotes: votes.reduce((sum: number, vote: bigint) => sum + Number(vote), 0),
      totalReward: Number(totalFunding) / 1e18,
      status: isActive ? "active" as const : "closed" as const,
      category: "General",
      fundingType: "none" as const,
      options: options.map((option: string, index: number) => ({
        id: `${id}-${index}`,
        text: option,
        votes: Number(votes[index]),
        percentage: votes.length > 0 ? Math.round((Number(votes[index]) / votes.reduce((sum: number, vote: bigint) => sum + Number(vote), 0)) * 100) : 0
      }))
    }
  }).filter(Boolean) || []

  const polls = isConnected && !pollsError ? contractPolls : []
  const isLoading = pollsLoading

  const handleVote = async (pollId: string, optionId: string) => {
    console.log("=== VOTE DEBUG ===")
    console.log("Poll ID:", pollId)
    console.log("Option ID:", optionId)
    
    if (!isConnected) {
      alert("Please connect your wallet to vote")
      return
    }

    try {
      // Extract option index from optionId (format: "pollId-optionIndex")
      const optionIndex = parseInt(optionId.split('-')[1])
      console.log("Extracted option index:", optionIndex)
      console.log("Parsed poll ID:", parseInt(pollId))
      
      if (isNaN(optionIndex) || isNaN(parseInt(pollId))) {
        throw new Error("Invalid poll ID or option index")
      }
      
      console.log("Calling vote with:", parseInt(pollId), optionIndex)
      await vote(parseInt(pollId), optionIndex)
      
    } catch (error) {
      console.error("Vote failed:", error)
      
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          alert("Transaction was rejected by user")
        } else if (error.message.includes("insufficient funds")) {
          alert("Insufficient funds for transaction")
        } else if (error.message.includes("already voted")) {
          alert("You have already voted on this poll")
        } else {
          alert(`Vote failed: ${error.message}`)
        }
      } else {
        alert("Vote failed. Please try again.")
      }
    }
  }

  const filteredPolls = polls.filter((poll) => {
    if (
      filters.search &&
      !poll.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !poll.description?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }
    if (filters.status !== "All Status" && poll.status !== filters.status.toLowerCase()) {
      return false
    }
    if (filters.category !== "All Categories" && poll.category !== filters.category) {
      return false
    }
    if (filters.fundingType !== "All Funding") {
      const fundingMap = {
        "Self-funded": "self",
        Community: "community",
        "No rewards": "none",
      }
      if (poll.fundingType !== fundingMap[filters.fundingType as keyof typeof fundingMap]) {
        return false
      }
    }
    return true
  })

  const totalPolls = Number(nextPollId || 0n)
  const activePolls = activePollIds?.length || 0

  const stats = {
    totalPolls,
    activePolls,
    totalVotes: polls.reduce((sum, poll) => sum + poll.totalVotes, 0),
    totalRewards: polls.reduce((sum, poll) => sum + poll.totalReward, 0),
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Explore Polls</h1>
          <p className="text-muted-foreground">
            Discover and participate in community-driven decisions
            {!isConnected && " • Connect wallet to interact with live polls"}
          </p>
          {pollsError && (
            <div className="flex items-center gap-2 text-amber-600 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Contract not deployed on this network - showing demo data</span>
            </div>
          )}
        </div>
        <Button asChild size="lg">
          <Link href="/dapp/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">{stats.totalPolls}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Polls</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span className="text-2xl font-bold">{stats.activePolls}</span>
          </div>
          <p className="text-sm text-muted-foreground">Active Polls</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-2xl font-bold">{stats.totalVotes.toLocaleString()}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Votes</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{stats.totalRewards.toFixed(1)} ETH</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Rewards</p>
        </div>
      </div>

      {/* Filters */}
      <PollFilters filters={filters} onFiltersChange={setFilters} />

      {/* Polls Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card p-6 rounded-lg border animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              onViewDetails={(pollId) => {
                console.log("View details:", pollId)
                // TODO: Navigate to poll details
              }}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredPolls.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {isConnected && activePollIds?.length === 0
              ? "No active polls found on the contract."
              : "No polls found matching your criteria."
            }
          </p>
          <Button asChild className="mt-4">
            <Link href="/dapp/create">
              {isConnected && activePollIds?.length === 0 ? "Create the first poll" : "Create a poll"}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
