/**
 * Type mappers to transform subgraph data to frontend types
 */

import { formatUnits } from 'viem'
import type { Address } from 'viem'
import type { SubgraphPoll, SubgraphFunding, SubgraphUser } from '@/types/subgraph'
import type { FormattedPoll } from '@/hooks/use-polls'

/**
 * Convert BigInt string to number
 */
function bigIntToNumber(value: string): number {
  try {
    return Number(value)
  } catch {
    return 0
  }
}

/**
 * Convert timestamp BigInt string to ISO date string
 */
function timestampToISO(timestamp: string): string {
  try {
    const ms = bigIntToNumber(timestamp) * 1000
    return new Date(ms).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

/**
 * Convert Wei amount to ETH as number
 */
function weiToETH(wei: string): number {
  try {
    return parseFloat(formatUnits(BigInt(wei), 18))
  } catch {
    return 0
  }
}

/**
 * Calculate vote percentages
 */
function calculatePercentages(votes: string[]): number[] {
  const voteNumbers = votes.map(bigIntToNumber)
  const total = voteNumbers.reduce((sum, v) => sum + v, 0)

  if (total === 0) {
    return votes.map(() => 0)
  }

  return voteNumbers.map(v => Math.round((v / total) * 100))
}

/**
 * Determine poll status
 */
function getPollStatus(isActive: boolean, endTime: string): 'active' | 'ended' {
  if (!isActive) return 'ended'

  const endTimestamp = bigIntToNumber(endTime) * 1000
  const now = Date.now()

  return now < endTimestamp ? 'active' : 'ended'
}

/**
 * Determine funding type
 */
function getFundingType(totalFunding: string, creator: SubgraphUser | string): 'community' | 'self' | 'none' {
  const fundingAmount = bigIntToNumber(totalFunding)

  if (fundingAmount === 0) {
    return 'none'
  }

  // TODO: Could check if creator is the only funder
  // For now, assume community if there's any funding
  return 'community'
}

/**
 * Map subgraph poll to frontend FormattedPoll
 */
export function mapSubgraphPollToFormattedPoll(poll: SubgraphPoll): FormattedPoll {
  const creator = typeof poll.creator === 'string' ? poll.creator : poll.creator.address
  const voteNumbers = poll.votes.map(bigIntToNumber)
  const percentages = calculatePercentages(poll.votes)
  const totalVotes = voteNumbers.reduce((sum, v) => sum + v, 0)

  // Get total funding from tokenBalances if available, otherwise use totalFundingAmount
  let totalReward = 0
  if (poll.tokenBalances && poll.tokenBalances.length > 0) {
    // Sum all token balances (assuming they're all in ETH/wei for now)
    totalReward = poll.tokenBalances.reduce((sum, tb) => {
      return sum + weiToETH(tb.balance)
    }, 0)
  } else {
    totalReward = weiToETH(poll.totalFundingAmount || '0')
  }

  return {
    id: bigIntToNumber(poll.pollId).toString(),
    title: poll.question,
    description: undefined, // Not stored in contract
    creator: creator as Address,
    createdAt: timestampToISO(poll.createdAt),
    endsAt: timestampToISO(poll.endTime),
    totalVotes,
    totalReward,
    status: getPollStatus(poll.isActive, poll.endTime),
    category: 'Governance', // Default category
    fundingType: getFundingType(poll.totalFundingAmount || '0', poll.creator),
    options: poll.options.map((text, index) => ({
      id: `${poll.id}-${index}`,
      text,
      votes: voteNumbers[index] || 0,
      percentage: percentages[index] || 0,
    })),
  }
}

/**
 * Map array of subgraph polls to formatted polls
 */
export function mapSubgraphPollsToFormattedPolls(polls: SubgraphPoll[]): FormattedPoll[] {
  return polls.map(mapSubgraphPollToFormattedPoll)
}

/**
 * Map subgraph funding to simplified funding object
 */
export interface SimplifiedFunding {
  id: string
  funder: Address
  funderAddress: Address
  token: Address
  tokenSymbol: string
  tokenName: string
  amount: string // Wei as string
  amountFormatted: number // In ETH
  timestamp: string // ISO string
  timestampUnix: number
  transactionHash: string
  blockNumber: number
}

export function mapSubgraphFundingToSimplified(funding: SubgraphFunding): SimplifiedFunding {
  const token = typeof funding.token === 'string' ? null : funding.token
  const funder = typeof funding.funder === 'string' ? funding.funder : funding.funder.address

  return {
    id: funding.id,
    funder: funder as Address,
    funderAddress: funder as Address,
    token: (token?.address || funding.token) as Address,
    tokenSymbol: token?.symbol || 'ETH',
    tokenName: token?.name || 'Ethereum',
    amount: funding.amount,
    amountFormatted: weiToETH(funding.amount),
    timestamp: timestampToISO(funding.timestamp),
    timestampUnix: bigIntToNumber(funding.timestamp),
    transactionHash: funding.transactionHash,
    blockNumber: bigIntToNumber(funding.blockNumber),
  }
}

/**
 * Map array of subgraph fundings
 */
export function mapSubgraphFundingsToSimplified(fundings: SubgraphFunding[]): SimplifiedFunding[] {
  return fundings.map(mapSubgraphFundingToSimplified)
}

/**
 * Helper to format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Helper to format ETH amounts
 */
export function formatETHAmount(wei: string): string {
  const eth = weiToETH(wei)
  if (eth === 0) return '0 ETH'
  if (eth < 0.0001) return '< 0.0001 ETH'
  if (eth < 1) return `${eth.toFixed(4)} ETH`
  if (eth < 100) return `${eth.toFixed(2)} ETH`
  return `${formatNumber(Math.floor(eth))} ETH`
}

/**
 * Helper to format relative time
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
