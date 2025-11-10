/**
 * Unified hook for fetching statistics - routes to subgraph or contract based on data source
 */

'use client'

import { useDataSource } from '@/hooks/use-data-source'
import { useSubgraphGlobalStats, useSubgraphDailyStats } from '@/hooks/subgraph/use-subgraph-stats'

export interface GlobalStats {
  totalPolls: number
  totalVotes: number
  totalFunding: number
  totalDistributions: number
  totalUsers: number
  totalVoters: number
  totalFunders: number
  whitelistedTokens: number
}

export interface DailyStats {
  date: string
  polls: number
  votes: number
  funding: number
  distributions: number
  activeUsers: number
}

export interface UseGlobalStatsDataReturn {
  stats: GlobalStats | null
  loading: boolean
  error: Error | null
}

export interface UseDailyStatsDataReturn {
  stats: DailyStats[]
  loading: boolean
  error: Error | null
}

/**
 * Hook to fetch global statistics from the active data source
 *
 * Note: Global statistics are only available from subgraph.
 * Contract doesn't expose aggregate statistics efficiently.
 */
export function useGlobalStatsData(): UseGlobalStatsDataReturn {
  const { isSubgraph } = useDataSource()

  // Route to subgraph
  const subgraphResult = useSubgraphGlobalStats()

  if (isSubgraph) {
    return {
      stats: subgraphResult.stats,
      loading: subgraphResult.loading,
      error: subgraphResult.error || null,
    }
  }

  // Contract source: Statistics not available
  return {
    stats: null,
    loading: false,
    error: new Error('Global statistics are only available with subgraph data source. Switch to subgraph in settings.'),
  }
}

/**
 * Hook to fetch daily statistics from the active data source
 *
 * Note: Daily statistics are only available from subgraph.
 * Contract doesn't track historical daily metrics.
 */
export function useDailyStatsData(days = 30): UseDailyStatsDataReturn {
  const { isSubgraph } = useDataSource()

  // Route to subgraph
  const subgraphResult = useSubgraphDailyStats(days)

  if (isSubgraph) {
    return {
      stats: subgraphResult.stats,
      loading: subgraphResult.loading,
      error: subgraphResult.error || null,
    }
  }

  // Contract source: Statistics not available
  return {
    stats: [],
    loading: false,
    error: new Error('Daily statistics are only available with subgraph data source. Switch to subgraph in settings.'),
  }
}
