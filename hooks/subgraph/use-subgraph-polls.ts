/**
 * Hook to fetch polls from The Graph subgraph
 * Implements incremental loading - appends new polls instead of refetching all
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@apollo/client/react'
import { apolloClient } from '@/lib/graphql/apollo-client'
import { GET_POLLS, GET_ACTIVE_POLLS, GET_POLL } from '@/lib/graphql/queries/polls'
import { mapSubgraphPollsToFormattedPolls, mapSubgraphPollToFormattedPoll } from '@/lib/graphql/mappers'
import type { GetPollsResponse, PollsQueryVariables, SubgraphPoll } from '@/types/subgraph'
import type { FormattedPoll } from '@/hooks/use-polls'

export interface UseSubgraphPollsOptions {
  first?: number
  skip?: number
  activeOnly?: boolean
  where?: PollsQueryVariables['where']
}

export function useSubgraphPolls(options: UseSubgraphPollsOptions = {}) {
  const {
    first = 20,
    skip = 0,
    activeOnly = false,
    where,
  } = options

  // Client-side only flag to prevent SSR issues
  const [isClient, setIsClient] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Store polls in state so we can update individual polls
  const [pollsState, setPollsState] = useState<FormattedPoll[]>([])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const query = activeOnly ? GET_ACTIVE_POLLS : GET_POLLS

  const variables: PollsQueryVariables = {
    first,
    skip,
    orderBy: 'createdAt',
    orderDirection: 'desc',
    where,
  }

  const { data, loading, error, fetchMore, refetch } = useQuery<GetPollsResponse>(query, {
    client: apolloClient,
    variables,
    fetchPolicy: 'cache-and-network',
    skip: !isClient, // Don't run during SSR
  })

  // Update polls state when data changes
  useEffect(() => {
    if (data?.polls) {
      const formattedPolls = mapSubgraphPollsToFormattedPolls(data.polls)
      setPollsState(formattedPolls)
    }
  }, [data])

  // hasMore is true if the total polls fetched equals a multiple of `first`
  // (meaning there could be more pages)
  const hasMore = data?.polls && data.polls.length > 0 && data.polls.length % first === 0

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      await fetchMore({
        variables: {
          skip: pollsState.length, // Use current polls length as offset
        },
      })
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, loading, isLoadingMore, fetchMore, pollsState.length])

  // Refetch a single poll by ID and update it in the polls state
  const refetchPoll = useCallback(async (pollId: number) => {
    try {
      // Convert pollId to the hex format used by subgraph (Bytes)
      const hexPollId = '0x' + pollId.toString(16).padStart(2, '0')

      const { data: pollData } = await apolloClient.query<{ poll: SubgraphPoll | null }>({
        query: GET_POLL,
        variables: { id: hexPollId },
        fetchPolicy: 'network-only', // Always fetch fresh data
      })

      if (pollData?.poll) {
        const updatedPoll = mapSubgraphPollToFormattedPoll(pollData.poll)
        setPollsState(prev =>
          prev.map(poll => poll.id === pollId.toString() ? updatedPoll : poll)
        )
      }
    } catch (error) {
      console.error('Failed to refetch poll from subgraph:', error)
    }
  }, [])

  return {
    polls: pollsState,
    loading: loading && pollsState.length === 0, // Only show loading for initial fetch
    loadingMore: isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    refetchPoll,
  }
}

/**
 * Hook to get active polls only
 */
export function useSubgraphActivePolls(first = 20) {
  return useSubgraphPolls({ first, activeOnly: true })
}

/**
 * Hook to get ended polls
 */
export function useSubgraphEndedPolls(first = 20) {
  return useSubgraphPolls({
    first,
    where: { isActive: false },
  })
}

/**
 * Hook to get polls by creator
 */
export function useSubgraphPollsByCreator(creatorAddress: string, first = 20) {
  return useSubgraphPolls({
    first,
    where: { creator: creatorAddress.toLowerCase() },
  })
}
