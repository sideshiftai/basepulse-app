/**
 * Hook to fetch polls from The Graph subgraph
 */

'use client'

import { useQuery } from '@apollo/client'
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
  })

  const polls: FormattedPoll[] = data?.polls
    ? mapSubgraphPollsToFormattedPolls(data.polls)
    : []

  const hasMore = data?.polls && data.polls.length === first

  const loadMore = async () => {
    if (!hasMore || loading) return

    await fetchMore({
      variables: {
        skip: skip + first,
      },
    })
  }

  return {
    polls,
    loading,
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
