/**
 * Participant Rewards Page
 * Main page for viewing and claiming poll rewards
 */

"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId } from "wagmi"
import { AlertCircle } from "lucide-react"
import { ParticipantBreadcrumb } from "@/components/participant/participant-breadcrumb"
import { CreatorHeaderBanner } from "@/components/creator/creator-header-banner"
import { ParticipantStats } from "@/components/participant/participant-stats"
import { ClaimableRewardsList } from "@/components/participant/claimable-rewards-list"
import { ClaimHistory } from "@/components/participant/claim-history"
import {
  fetchParticipantRewards,
  fetchParticipantStats,
  fetchClaimHistory,
} from "@/lib/api/participant"

export default function ParticipantPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const [stats, setStats] = useState({
    totalClaimable: "0.00 ETH",
    pollsParticipated: 0,
    totalClaimed: "0.00 ETH",
    pendingClaims: 0,
  })
  const [rewards, setRewards] = useState<any[]>([])
  const [claimHistory, setClaimHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!address || !chainId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [statsData, rewardsData, historyData] = await Promise.all([
          fetchParticipantStats(address, chainId),
          fetchParticipantRewards(address, chainId),
          fetchClaimHistory(address, chainId),
        ])

        setStats(statsData)
        setRewards(rewardsData)
        setClaimHistory(historyData)
      } catch (error) {
        console.error("Error loading participant data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [address, chainId])

  // Show wallet connection warning if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <ParticipantBreadcrumb />

          <div className="flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <p className="text-sm">
              Please connect your wallet to view your rewards
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
        <ParticipantBreadcrumb />

        {/* Header Banner */}
        <CreatorHeaderBanner
          title="My Rewards"
          description="View and claim your poll rewards from polls you've participated in"
        />

        {/* Stats */}
        <ParticipantStats
          totalClaimable={stats.totalClaimable}
          pollsParticipated={stats.pollsParticipated}
          totalClaimed={stats.totalClaimed}
          pendingClaims={stats.pendingClaims}
          isLoading={isLoading}
        />

        {/* Claimable Rewards Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Claimable Rewards</h2>
            <p className="text-sm text-muted-foreground">
              Rewards available to claim from polls you participated in
            </p>
          </div>

          <ClaimableRewardsList rewards={rewards} isLoading={isLoading} />
        </div>

        {/* Claim History Section */}
        <ClaimHistory claims={claimHistory} isLoading={isLoading} />
      </div>
    </div>
  )
}
