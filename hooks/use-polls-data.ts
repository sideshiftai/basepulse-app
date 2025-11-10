/**
 * Unified hook for fetching polls - routes to subgraph or contract based on data source
 */

'use client'

import { useDataSource } from '@/hooks/use-data-source'
import { useSubgraphPolls, useSubgraphActivePolls, useSubgraphEndedPolls, type UseSubgraphPollsOptions } from '@/hooks/subgraph/use-subgraph-polls'
import { useFormattedActivePolls, type FormattedPoll } from '@/hooks/use-polls'

export interface UsePollsDataOptions {
  first?: number
  skip?: number
  activeOnly?: boolean
  endedOnly?: boolean
  where?: UseSubgraphPollsOptions['where']
}

export interface UsePollsDataReturn {
  polls: FormattedPoll[]
  loading: boolean
  error: Error | null
  hasMore?: boolean
  loadMore?: () => Promise<void>
  refetch?: () => Promise<void>
}

/**
 * Main hook to fetch polls from the active data source
 * Automatically routes to subgraph or contract based on user preference
 */
export function usePollsData(options: UsePollsDataOptions = {}): UsePollsDataReturn {
  const { dataSource, isSubgraph } = useDataSource()
  const { first = 20, skip = 0, activeOnly = false, endedOnly = false, where } = options

  // Route to subgraph
  const subgraphResult = useSubgraphPolls({
    first,
    skip,
    activeOnly,
    where: endedOnly ? { isActive: false, ...where } : where,
  })

  // Route to contract
  const contractResult = useFormattedActivePolls()

  // Return appropriate result based on data source
  if (isSubgraph) {
    return {
      polls: subgraphResult.polls,
      loading: subgraphResult.loading,
      error: subgraphResult.error || null,
      hasMore: subgraphResult.hasMore,
      loadMore: subgraphResult.loadMore,
      refetch: subgraphResult.refetch,
    }
  }

  // Contract source
  return {
    polls: contractResult.polls,
    loading: contractResult.isLoading,
    error: contractResult.error ? new Error(contractResult.error.message) : null,
    hasMore: false,
    loadMore: undefined,
    refetch: undefined,
  }
}

/**
 * Convenience hook to get only active polls
 */
export function useActivePollsData(first = 20): UsePollsDataReturn {
  return usePollsData({ first, activeOnly: true })
}

/**
 * Convenience hook to get only ended polls
 */
export function useEndedPollsData(first = 20): UsePollsDataReturn {
  return usePollsData({ first, endedOnly: true })
}

/**
 * Hook to get polls by creator address
 */
export function usePollsByCreatorData(creatorAddress: string, first = 20): UsePollsDataReturn {
  const { isSubgraph } = useDataSource()

  if (!isSubgraph) {
    // Contract doesn't support filtering by creator efficiently
    // Return empty result with a note
    return {
      polls: [],
      loading: false,
      error: new Error('Filtering by creator is only available with subgraph data source'),
      hasMore: false,
    }
  }

  return usePollsData({
    first,
    where: { creator: creatorAddress.toLowerCase() },
  })
}
