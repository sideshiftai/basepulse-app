"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PollCard } from "@/components/poll-card"
import { PollFilters } from "@/components/poll-filters"
import { Plus, TrendingUp, Clock, Users, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useActivePolls, useNextPollId } from "@/lib/contracts/polls-contract-utils"
import { useAccount } from "wagmi"

// Mock data for demonstration (keeping as fallback)
const mockPolls = [
  {
    id: "1",
    title: "Should we implement a new governance token for the community?",
    description:
      "This poll will determine if we should create a new governance token to give community members voting power on future decisions.",
    creator: "0x1234567890abcdef1234567890abcdef12345678",
    createdAt: "2024-01-15T10:00:00Z",
    endsAt: "2024-01-25T10:00:00Z",
    totalVotes: 1247,
    totalReward: 2.5,
    status: "active" as const,
    category: "Governance",
    fundingType: "community" as const,
    options: [
      { id: "1a", text: "Yes, implement governance token", votes: 847, percentage: 68 },
      { id: "1b", text: "No, keep current system", votes: 400, percentage: 32 },
    ],
  },
]

export default function DappPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "All Status",
    category: "All Categories",
    fundingType: "All Funding",
    sortBy: "Latest",
  })

  const { isConnected } = useAccount()
  const { data: activePollIds, isLoading: pollsLoading, error: pollsError } = useActivePolls()
  const { data: nextPollId, isLoading: nextIdLoading } = useNextPollId()

  // Use contract data if available and wallet is connected, otherwise use mock data
  const useContractData = isConnected && !pollsError
  const polls = useContractData ? [] : mockPolls // TODO: Implement contract data parsing
  const isLoading = useContractData ? pollsLoading : false

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

  const totalPolls = useContractData ? Number(nextPollId || 0n) : mockPolls.length
  const activePolls = useContractData ? (activePollIds?.length || 0) : mockPolls.filter((p) => p.status === "active").length

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
              onVote={(pollId, optionId) => {
                console.log("Vote:", pollId, optionId)
                // TODO: Implement voting logic with contract
              }}
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
            {useContractData && activePollIds?.length === 0
              ? "No active polls found on the contract."
              : "No polls found matching your criteria."
            }
          </p>
          <Button asChild className="mt-4">
            <Link href="/dapp/create">
              {useContractData && activePollIds?.length === 0 ? "Create the first poll" : "Create a poll"}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
