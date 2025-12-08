/**
 * Hook to fetch polls from The Graph subgraph
 * Implements incremental loading - appends new polls instead of refetching all
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@apollo/client/react'
import { apolloClient } from '@/lib/graphql/apollo-client'
import { GET_POLLS, GET_ACTIVE_POLLS } from '@/lib/graphql/queries/polls'
import { mapSubgraphPollsToFormattedPolls } from '@/lib/graphql/mappers'
import type { GetPollsResponse, PollsQueryVariables } from '@/types/subgraph'
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

  const polls: FormattedPoll[] = data?.polls
    ? mapSubgraphPollsToFormattedPolls(data.polls)
    : []

  // hasMore is true if the total polls fetched equals a multiple of `first`
  // (meaning there could be more pages)
  const hasMore = data?.polls && data.polls.length > 0 && data.polls.length % first === 0

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      await fetchMore({
        variables: {
          skip: polls.length, // Use current polls length as offset
        },
      })
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, loading, isLoadingMore, fetchMore, polls.length])

  return {
    polls,
    loading: loading && polls.length === 0, // Only show loading for initial fetch
    loadingMore: isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
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
