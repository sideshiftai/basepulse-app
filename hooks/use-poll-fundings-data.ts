/**
 * Unified hook for fetching poll fundings - routes to subgraph or contract based on data source
 */

'use client'

import { useDataSource } from '@/hooks/use-data-source'
import { useSubgraphPollFundings } from '@/hooks/subgraph/use-subgraph-fundings'
import type { SimplifiedFunding } from '@/lib/graphql/mappers'

export interface UsePollFundingsDataReturn {
  fundings: SimplifiedFunding[]
  totalFunding: number
  fundingCount: number
  loading: boolean
  error: Error | null
  refetch?: () => Promise<void>
}

/**
 * Main hook to fetch poll funding history from the active data source
 * Automatically routes to subgraph or contract based on user preference
 *
 * Note: Contract-based funding history is not efficiently available,
 * so this hook always uses the subgraph source
 */
export function usePollFundingsData(
  pollId: string | number,
  first = 100
): UsePollFundingsDataReturn {
  const { isSubgraph } = useDataSource()

  // Route to subgraph
  const subgraphResult = useSubgraphPollFundings(pollId, first)

  // Return subgraph result
  if (isSubgraph) {
    return {
      fundings: subgraphResult.fundings,
      totalFunding: subgraphResult.totalFunding,
      fundingCount: subgraphResult.fundingCount,
      loading: subgraphResult.loading,
      error: subgraphResult.error || null,
      refetch: subgraphResult.refetch,
    }
  }

  // Contract source: Funding history is not available from contract efficiently
  // We could potentially read events, but that's complex and slow
  // For now, return empty result with a note
  return {
    fundings: [],
    totalFunding: 0,
    fundingCount: 0,
    loading: false,
    error: new Error('Funding history is only available with subgraph data source. Switch to subgraph in settings.'),
  }
}
