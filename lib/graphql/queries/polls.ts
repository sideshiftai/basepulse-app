/**
 * GraphQL queries for The Graph subgraph
 */

import { gql } from '@apollo/client'

/**
 * Fragment for poll fields
 */
const POLL_FIELDS = gql`
  fragment PollFields on Poll {
    id
    question
    options
    votes
    endTime
    isActive
    creator
    createdAt
    totalFunding
  }
`

/**
 * Get a single poll by ID
 */
export const GET_POLL = gql`
  ${POLL_FIELDS}
  query GetPoll($id: ID!) {
    poll(id: $id) {
      ...PollFields
    }
  }
`

/**
 * Get multiple polls with filtering and pagination
 */
export const GET_POLLS = gql`
  ${POLL_FIELDS}
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
    }
  }
`

/**
 * Get active polls only
 */
export const GET_ACTIVE_POLLS = gql`
  ${POLL_FIELDS}
  query GetActivePolls(
    $first: Int = 20
    $skip: Int = 0
    $orderBy: Poll_orderBy = createdAt
    $orderDirection: OrderDirection = desc
  ) {
    polls(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { isActive: true }
    ) {
      ...PollFields
    }
  }
`

/**
 * Get global statistics
 */
export const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    globalStats(id: "global") {
      totalPolls
      totalVotes
      totalFunding
      totalDistributions
      totalUsers
      totalVoters
      totalFunders
      whitelistedTokens
    }
  }
`

/**
 * Get daily statistics
 */
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

/**
 * Get poll fundings
 */
export const GET_POLL_FUNDINGS = gql`
  query GetPollFundings(
    $pollId: ID!
    $first: Int = 100
    $orderBy: Funding_orderBy = timestamp
    $orderDirection: OrderDirection = desc
  ) {
    fundings(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { poll: $pollId }
    ) {
      id
      poll {
        id
      }
      funder
      token
      amount
      timestamp
    }
  }
`

/**
 * Get user's votes
 */
export const GET_USER_VOTES = gql`
  query GetUserVotes(
    $user: String!
    $first: Int = 100
  ) {
    votes(
      first: $first
      where: { voter: $user }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      poll {
        id
        question
      }
      voter
      optionIndex
      timestamp
    }
  }
`

/**
 * Get user's fundings
 */
export const GET_USER_FUNDINGS = gql`
  query GetUserFundings(
    $user: String!
    $first: Int = 100
  ) {
    fundings(
      first: $first
      where: { funder: $user }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      poll {
        id
        question
      }
      funder
      token
      amount
      timestamp
    }
  }
`
