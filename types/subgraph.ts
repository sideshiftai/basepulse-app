/**
 * TypeScript types for The Graph subgraph responses
 */

/**
 * Poll entity from subgraph
 */
export interface SubgraphPoll {
  id: string
  question: string
  options: string[]
  votes: string[]
  endTime: string
  isActive: boolean
  creator: string
  createdAt: string
  totalFunding: string
}

/**
 * Funding entity from subgraph
 */
export interface SubgraphFunding {
  id: string
  poll: {
    id: string
  }
  funder: string
  token: string
  amount: string
  timestamp: string
}

/**
 * Vote entity from subgraph
 */
export interface SubgraphVote {
  id: string
  poll: {
    id: string
    question: string
  }
  voter: string
  optionIndex: number
  timestamp: string
}

/**
 * Global statistics entity
 */
export interface SubgraphGlobalStats {
  totalPolls: string
  totalVotes: string
  totalFunding: string
  totalDistributions: string
  totalUsers: string
  totalVoters: string
  totalFunders: string
  whitelistedTokens: string
}

/**
 * Daily statistics entity
 */
export interface SubgraphDailyStats {
  id: string
  day: string
  dailyPolls: string
  dailyVotes: string
  dailyFunding: string
  dailyDistributions: string
  dailyActiveUsers: string
}

/**
 * Query response types
 */
export interface GetPollResponse {
  poll: SubgraphPoll | null
}

export interface GetPollsResponse {
  polls: SubgraphPoll[]
}

export interface GetGlobalStatsResponse {
  globalStats: SubgraphGlobalStats | null
}

export interface GetDailyStatsResponse {
  dailyStats: SubgraphDailyStats[]
}

export interface GetPollFundingsResponse {
  fundings: SubgraphFunding[]
}

export interface GetUserVotesResponse {
  votes: SubgraphVote[]
}

export interface GetUserFundingsResponse {
  fundings: SubgraphFunding[]
}

/**
 * Query variables types
 */
export interface PollQueryVariables {
  id: string
}

export interface PollsQueryVariables {
  first?: number
  skip?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  where?: {
    isActive?: boolean
    creator?: string
    [key: string]: any
  }
}

export interface FundingsQueryVariables {
  pollId: string
  first?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface UserQueryVariables {
  user: string
  first?: number
}

export interface DailyStatsQueryVariables {
  first?: number
}

/**
 * Simplified funding type for UI
 */
export interface SimplifiedFunding {
  funder: string
  token: string
  amount: number
  timestamp: Date
}
