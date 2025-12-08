'use client'

/**
 * Hook for paginated contract-based poll fetching using multicall
 * Used when data source is set to "contract"
 */

import { useState, useMemo, useCallback } from 'react'
import { useReadContracts, useChainId, useAccount } from 'wagmi'
import { Address } from 'viem'
import {
  useActivePolls,
  usePollsContractAddress,
} from '@/lib/contracts/polls-contract-utils'
import { POLLS_CONTRACT_ABI, FundingType } from '@/lib/contracts/polls-contract'
import { getTokenSymbol } from '@/lib/contracts/token-config'
import type { FormattedPoll } from '@/hooks/use-polls'

interface UseContractPollsPaginatedOptions {
  pageSize?: number
}

interface UseContractPollsPaginatedReturn {
  polls: FormattedPoll[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
  totalCount: number
}

/**
 * Hook that fetches polls from the contract with pagination using multicall
 */
export function useContractPollsPaginated(
  options: UseContractPollsPaginatedOptions = {}
): UseContractPollsPaginatedReturn {
  const { pageSize = 6 } = options
  const contractAddress = usePollsContractAddress()
  const chainId = useChainId()
  const { address: userAddress } = useAccount()

  // Get all active poll IDs
  const {
    data: allActivePollIds,
    isLoading: idsLoading,
    error: idsError,
    refetch: refetchIds,
  } = useActivePolls()

  // Track how many polls to display
  const [displayedCount, setDisplayedCount] = useState(pageSize)

  // Slice poll IDs to display
  const displayedPollIds = useMemo(() => {
    if (!allActivePollIds) return []
    return allActivePollIds.slice(0, displayedCount)
  }, [allActivePollIds, displayedCount])

  // Build multicall config for getPoll
  const pollCalls = useMemo(() => {
    if (!contractAddress || displayedPollIds.length === 0) return []

    return displayedPollIds.map((id) => ({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: 'getPoll' as const,
      args: [BigInt(id)],
    }))
  }, [displayedPollIds, contractAddress])

  // Build multicall config for hasUserVoted
  const votedCalls = useMemo(() => {
    if (!contractAddress || !userAddress || displayedPollIds.length === 0) return []

    return displayedPollIds.map((id) => ({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: 'hasUserVoted' as const,
      args: [BigInt(id), userAddress],
    }))
  }, [displayedPollIds, contractAddress, userAddress])

  // Fetch poll data using multicall
  const {
    data: pollsData,
    isLoading: pollsLoading,
    error: pollsError,
    refetch: refetchPolls,
  } = useReadContracts({
    contracts: pollCalls,
    query: {
      enabled: pollCalls.length > 0,
    },
  })

  // Fetch voting status using multicall
  const { data: votedData, isLoading: votedLoading } = useReadContracts({
    contracts: votedCalls,
    query: {
      enabled: votedCalls.length > 0 && !!userAddress,
    },
  })

  // Transform contract data to FormattedPoll format
  const polls = useMemo((): FormattedPoll[] => {
    if (!pollsData || !displayedPollIds.length) return []

    return pollsData
      .map((result, index) => {
        if (result.status !== 'success' || !result.result) return null

        const pollData = result.result as any[]
        const pollId = displayedPollIds[index]

        // Extract poll fields from contract response
        // [id, question, options, votes, endTime, isActive, creator, totalFunding, distributionMode, fundingToken, fundingType, status, previousStatus]
        const [
          id,
          question,
          options,
          votes,
          endTime,
          isActive,
          creator,
          totalFunding,
          distributionMode,
          fundingToken,
          fundingType,
        ] = pollData

        // Calculate total votes
        const votesArray = votes as bigint[]
        const totalVotes = votesArray.reduce(
          (sum: number, vote: bigint) => sum + Number(vote),
          0
        )

        // Determine funding type string
        let fundingTypeString: 'none' | 'self' | 'community'
        if (fundingType === FundingType.NONE) {
          fundingTypeString = 'none'
        } else if (fundingType === FundingType.SELF) {
          fundingTypeString = 'self'
        } else {
          fundingTypeString = 'community'
        }

        // Get token symbol
        const tokenSymbol = getTokenSymbol(chainId, fundingToken as Address) || 'ETH'

        // Check voting status
        const hasVoted =
          votedData?.[index]?.status === 'success'
            ? (votedData[index].result as boolean)
            : false

        // Determine status
        const endTimeMs = Number(endTime) * 1000
        const isEnded = Date.now() >= endTimeMs
        const status: 'active' | 'ended' = isActive && !isEnded ? 'active' : 'ended'

        return {
          id: pollId.toString(),
          title: question,
          description: `Poll created by ${creator}`,
          creator: creator as Address,
          createdAt: new Date().toISOString(), // Contract doesn't store creation time
          endsAt: new Date(endTimeMs).toISOString(),
          totalVotes,
          totalReward: Number(totalFunding) / 1e18,
          status,
          category: 'General',
          fundingType: fundingTypeString,
          fundingToken: tokenSymbol,
          chainId,
          hasVoted,
          options: (options as string[]).map((option: string, optIndex: number) => ({
            id: `${pollId}-${optIndex}`,
            text: option,
            votes: Number(votesArray[optIndex]),
            percentage:
              totalVotes > 0
                ? Math.round((Number(votesArray[optIndex]) / totalVotes) * 100)
                : 0,
          })),
        }
      })
      .filter(Boolean) as FormattedPoll[]
  }, [pollsData, votedData, displayedPollIds, chainId])

  // Load more polls
  const loadMore = useCallback(() => {
    setDisplayedCount((prev) => prev + pageSize)
  }, [pageSize])

  // Refetch all data
  const refetch = useCallback(() => {
    refetchIds()
    refetchPolls()
  }, [refetchIds, refetchPolls])

  // Calculate hasMore
  const hasMore = displayedCount < (allActivePollIds?.length || 0)

  return {
    polls,
    loading: idsLoading || pollsLoading || votedLoading,
    error: idsError || pollsError || null,
    hasMore,
    loadMore,
    refetch,
    totalCount: allActivePollIds?.length || 0,
  }
}
