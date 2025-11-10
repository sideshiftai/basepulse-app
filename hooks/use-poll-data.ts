/**
 * Unified hook for fetching a single poll - routes to subgraph or contract based on data source
 */

'use client'

import { useDataSource } from '@/hooks/use-data-source'
import { useSubgraphPoll } from '@/hooks/subgraph/use-subgraph-poll'
import { useFormattedPoll, type FormattedPoll } from '@/hooks/use-polls'

export interface UsePollDataReturn {
  poll: FormattedPoll | null
  loading: boolean
  error: Error | null
  refetch?: () => Promise<void>
}

/**
 * Main hook to fetch a single poll from the active data source
 * Automatically routes to subgraph or contract based on user preference
 */
export function usePollData(pollId: string | number): UsePollDataReturn {
  const { isSubgraph } = useDataSource()

  // Route to subgraph
  const subgraphResult = useSubgraphPoll(pollId)

  // Route to contract (convert to number if string)
  const pollIdNumber = typeof pollId === 'string' ? parseInt(pollId, 10) : pollId
  const contractResult = useFormattedPoll(pollIdNumber)

  // Return appropriate result based on data source
  if (isSubgraph) {
    return {
      poll: subgraphResult.poll,
      loading: subgraphResult.loading,
      error: subgraphResult.error || null,
      refetch: subgraphResult.refetch,
    }
  }

  // Contract source
  return {
    poll: contractResult.poll,
    loading: contractResult.isLoading,
    error: contractResult.error ? new Error(contractResult.error.message) : null,
    refetch: undefined,
  }
}
