/**
 * TypeScript types for subgraph entities
 * Based on schema.graphql from basepulse-subgraph
 */

export type Address = `0x${string}`

// Enums
export enum DistributionMode {
  MANUAL_PULL = 'MANUAL_PULL',
  MANUAL_PUSH = 'MANUAL_PUSH',
  AUTOMATED = 'AUTOMATED',
}

export enum DistributionType {
  WITHDRAWN = 'WITHDRAWN',
  DISTRIBUTED = 'DISTRIBUTED',
  CLAIMED = 'CLAIMED',
}

// Core Entities

export interface SubgraphPoll {
  id: string
  pollId: string
  creator: SubgraphUser
  question: string
  options: string[]
  votes: string[] // BigInt as string
  endTime: string // BigInt as string
  isActive: boolean
  totalFunding: string // BigInt as string (deprecated)
  distributionMode: DistributionMode
  voteCount: string // BigInt as string
  voterCount: string // BigInt as string
  totalFundingAmount: string // BigInt as string
  fundingCount: string // BigInt as string
  createdAt: string // BigInt as string
  updatedAt: string // BigInt as string
  createdAtBlock: string // BigInt as string
  updatedAtBlock: string // BigInt as string
  tokenBalances?: SubgraphPollTokenBalance[]
  fundings?: SubgraphFunding[]
  pollVotes?: SubgraphVote[]
  distributions?: SubgraphDistribution[]
}

export interface SubgraphVote {
  id: string
  poll: SubgraphPoll | string // Can be populated or just ID
  voter: SubgraphUser | string
  optionIndex: string // BigInt as string
  timestamp: string // BigInt as string
  blockNumber: string // BigInt as string
  transactionHash: string
}

export interface SubgraphFunding {
  id: string
  poll: SubgraphPoll | string
  funder: SubgraphUser | string
  token: SubgraphToken | string
  amount: string // BigInt as string
  timestamp: string // BigInt as string
  blockNumber: string // BigInt as string
  transactionHash: string
}

export interface SubgraphDistribution {
  id: string
  poll: SubgraphPoll | string
  recipient: SubgraphUser | string
  token: SubgraphToken | string
  amount: string // BigInt as string
  eventType: DistributionType
  timestamp: string // BigInt as string
  blockNumber: string // BigInt as string
  transactionHash: string
}

export interface SubgraphUser {
  id: string
  address: string
  pollsCreated?: SubgraphPoll[]
  votes?: SubgraphVote[]
  fundings?: SubgraphFunding[]
  distributions?: SubgraphDistribution[]
  totalRewards: string // BigInt as string
  totalFunded: string // BigInt as string
  pollsParticipated: number
  totalVotes: number
  pollsCreatedCount: number
  firstSeenAt: string // BigInt as string
  firstSeenAtBlock: string // BigInt as string
  lastSeenAt: string // BigInt as string
  lastSeenAtBlock: string // BigInt as string
}

export interface SubgraphToken {
  id: string
  address: string
  symbol: string
  name: string
  decimals: number
  isWhitelisted: boolean
  whitelistedAt?: string // BigInt as string
  whitelistedAtBlock?: string // BigInt as string
  totalFunded: string // BigInt as string
  totalDistributed: string // BigInt as string
  fundingCount: string // BigInt as string
  distributionCount: string // BigInt as string
  firstSeenAt: string // BigInt as string
  firstSeenAtBlock: string // BigInt as string
  lastSeenAt: string // BigInt as string
  lastSeenAtBlock: string // BigInt as string
}

export interface SubgraphPollTokenBalance {
  id: string
  poll: SubgraphPoll | string
  token: SubgraphToken
  balance: string // BigInt as string
  totalFunded: string // BigInt as string
  totalDistributed: string // BigInt as string
  updatedAt: string // BigInt as string
  updatedAtBlock: string // BigInt as string
}

// Statistics Entities

export interface SubgraphGlobalStats {
  id: string
  totalPolls: string // BigInt as string
  totalVotes: string // BigInt as string
  totalFunding: string // BigInt as string
  totalDistributions: string // BigInt as string
  totalUsers: string // BigInt as string
  totalVoters: string // BigInt as string
  totalFunders: string // BigInt as string
  whitelistedTokens: string // BigInt as string
  updatedAt: string // BigInt as string
  updatedAtBlock: string // BigInt as string
}

export interface SubgraphDailyStats {
  id: string
  day: string // BigInt as string
  dailyPolls: string // BigInt as string
  dailyVotes: string // BigInt as string
  dailyFunding: string // BigInt as string
  dailyDistributions: string // BigInt as string
  dailyActiveUsers: string // BigInt as string
  updatedAt: string // BigInt as string
  updatedAtBlock: string // BigInt as string
}

export interface SubgraphTokenStats {
  id: string
  token: SubgraphToken
  totalFundingVolume: string // BigInt as string
  totalDistributionVolume: string // BigInt as string
  fundingCount: string // BigInt as string
  distributionCount: string // BigInt as string
  pollsFunded: string // BigInt as string
  updatedAt: string // BigInt as string
  updatedAtBlock: string // BigInt as string
}

// Query response types

export interface GetPollsResponse {
  polls: SubgraphPoll[]
}

export interface GetPollResponse {
  poll: SubgraphPoll | null
}

export interface GetPollFundingsResponse {
  fundings: SubgraphFunding[]
}

export interface GetUserVotesResponse {
  votes: SubgraphVote[]
}

export interface GetGlobalStatsResponse {
  globalStats: SubgraphGlobalStats | null
}

export interface GetDailyStatsResponse {
  dailyStats: SubgraphDailyStats[]
}

export interface GetTokenStatsResponse {
  tokens: SubgraphToken[]
}

export interface GetUserProfileResponse {
  user: SubgraphUser | null
}

// Query variables types

export interface PollsQueryVariables {
  first?: number
  skip?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  where?: {
    isActive?: boolean
    creator?: string
    endTime_gt?: string
    endTime_lt?: string
    totalFundingAmount_gt?: string
  }
}

export interface PollQueryVariables {
  id: string
}

export interface PollFundingsQueryVariables {
  pollId: string
  first?: number
}

export interface UserVotesQueryVariables {
  userId: string
  first?: number
}

export interface UserVoteOnPollQueryVariables {
  pollId: string
  userId: string
}
