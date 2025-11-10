/**
 * GraphQL queries for polls from The Graph subgraph
 */

import { gql } from '@apollo/client'

// Fragment for poll fields
export const POLL_FIELDS = gql`
  fragment PollFields on Poll {
    id
    pollId
    question
    options
    votes
    endTime
    isActive
    distributionMode
    voteCount
    voterCount
    totalFundingAmount
    fundingCount
    createdAt
    updatedAt
    creator {
      id
      address
      pollsCreatedCount
    }
  }
`

// Fragment for poll with relations
export const POLL_FULL_FIELDS = gql`
  fragment PollFullFields on Poll {
    ...PollFields
    tokenBalances {
      id
      token {
        id
        symbol
        name
        decimals
      }
      balance
      totalFunded
      totalDistributed
    }
    fundings {
      id
      funder {
        id
        address
      }
      token {
        id
        symbol
        name
      }
      amount
      timestamp
      transactionHash
    }
    pollVotes {
      id
      voter {
        id
        address
      }
      optionIndex
      timestamp
    }
  }
  ${POLL_FIELDS}
`

// Get multiple polls with pagination
export const GET_POLLS = gql`
  query GetPolls(
    $first: Int = 20
    $skip: Int = 0
    $orderBy: Poll_orderBy = createdAt
    $orderDirection: OrderDirection = desc
    $where: Poll_filter
  ) {
    polls(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      ...PollFields
      tokenBalances {
        token {
          symbol
        }
        balance
      }
    }
  }
  ${POLL_FIELDS}
`

// Get single poll by ID with full details
export const GET_POLL = gql`
  query GetPoll($id: Bytes!) {
    poll(id: $id) {
      ...PollFullFields
    }
  }
  ${POLL_FULL_FIELDS}
`

// Get polls by creator address
export const GET_POLLS_BY_CREATOR = gql`
  query GetPollsByCreator(
    $creatorId: Bytes!
    $first: Int = 20
    $skip: Int = 0
  ) {
    polls(
      first: $first
      skip: $skip
      where: { creator: $creatorId }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...PollFields
    }
  }
  ${POLL_FIELDS}
`

// Get active polls only
export const GET_ACTIVE_POLLS = gql`
  query GetActivePolls($first: Int = 20, $skip: Int = 0) {
    polls(
      first: $first
      skip: $skip
      where: { isActive: true }
      orderBy: endTime
      orderDirection: asc
    ) {
      ...PollFields
      tokenBalances {
        token {
          symbol
        }
        balance
      }
    }
  }
  ${POLL_FIELDS}
`

// Get poll fundings
export const GET_POLL_FUNDINGS = gql`
  query GetPollFundings($pollId: Bytes!, $first: Int = 100) {
    fundings(
      first: $first
      where: { poll: $pollId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      funder {
        id
        address
      }
      token {
        id
        symbol
        name
        address
      }
      amount
      timestamp
      blockNumber
      transactionHash
    }
  }
`

// Get user's votes
export const GET_USER_VOTES = gql`
  query GetUserVotes($userId: Bytes!, $first: Int = 50) {
    votes(
      first: $first
      where: { voter: $userId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      poll {
        id
        pollId
        question
      }
      optionIndex
      timestamp
      transactionHash
    }
  }
`

// Check if user voted on poll
export const GET_USER_VOTE_ON_POLL = gql`
  query GetUserVoteOnPoll($pollId: Bytes!, $userId: Bytes!) {
    votes(where: { poll: $pollId, voter: $userId }, first: 1) {
      id
      optionIndex
      timestamp
    }
  }
`

// Get global statistics
export const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    globalStats(id: "0x676c6f62616c") {
      id
      totalPolls
      totalVotes
      totalFunding
      totalDistributions
      totalUsers
      totalVoters
      totalFunders
      whitelistedTokens
      updatedAt
    }
  }
`

// Get daily statistics
export const GET_DAILY_STATS = gql`
  query GetDailyStats($first: Int = 30) {
    dailyStats(
      first: $first
      orderBy: day
      orderDirection: desc
    ) {
      id
      day
      dailyPolls
      dailyVotes
      dailyFunding
      dailyDistributions
      dailyActiveUsers
    }
  }
`

// Get token statistics
export const GET_TOKEN_STATS = gql`
  query GetTokenStats {
    tokens(
      where: { isWhitelisted: true }
      orderBy: totalFunded
      orderDirection: desc
    ) {
      id
      symbol
      name
      decimals
      totalFunded
      totalDistributed
      fundingCount
      distributionCount
    }
  }
`

// Get user profile
export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: Bytes!) {
    user(id: $userId) {
      id
      address
      totalRewards
      totalFunded
      pollsParticipated
      totalVotes
      pollsCreatedCount
      firstSeenAt
      lastSeenAt
    }
  }
`

// Search polls by question (client-side filtering needed)
export const SEARCH_POLLS = gql`
  query SearchPolls($first: Int = 100) {
    polls(
      first: $first
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...PollFields
    }
  }
  ${POLL_FIELDS}
`
