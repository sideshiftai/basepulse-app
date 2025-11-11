/**
 * Data mappers to transform subgraph data to frontend types
 */

import { Address } from 'viem'
import type { FormattedPoll, parsePollMetadata } from '@/hooks/use-polls'
import type {
  SubgraphPoll,
  SubgraphFunding,
  SimplifiedFunding,
} from '@/types/subgraph'

/**
 * Parse token metadata from poll question
 * Format: "TITLE|TOKEN:SYMBOL"
 */
function extractPollMetadata(questionWithMetadata: string): { title: string; token?: string } {
  const parts = questionWithMetadata.split('|TOKEN:')
  if (parts.length === 2) {
    return {
      title: parts[0],
      token: parts[1],
    }
  }
  return { title: questionWithMetadata }
}

/**
 * Map a single subgraph poll to FormattedPoll
 */
export function mapSubgraphPollToFormattedPoll(poll: SubgraphPoll): FormattedPoll {
  // Parse metadata from question
  const metadata = extractPollMetadata(poll.question)

  // Calculate total votes
  const totalVotes = poll.votes.reduce((sum, votes) => sum + Number(votes), 0)

  // Map options with vote counts and percentages
  const options = poll.options.map((option, index) => {
    const votes = Number(poll.votes[index])
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

    return {
      id: `${poll.id}-${index}`,
      text: option,
      votes,
      percentage,
    }
  })

  // Determine status
  const endTimeMs = Number(poll.endTime) * 1000
  const isEnded = Date.now() >= endTimeMs
  const status: 'active' | 'ended' = poll.isActive && !isEnded ? 'active' : 'ended'

  // Determine funding type
  const totalFundingNum = Number(poll.totalFunding)
  const fundingType: 'community' | 'self' | 'none' =
    totalFundingNum > 0 ? 'self' : 'none'

  return {
    id: poll.id,
    title: metadata.title,
    description: '', // Subgraph doesn't store separate description
    creator: poll.creator as Address,
    createdAt: new Date(Number(poll.createdAt) * 1000).toISOString(),
    endsAt: new Date(endTimeMs).toISOString(),
    totalVotes,
    totalReward: totalFundingNum / 1e18, // Convert from wei to ETH
    status,
    category: 'General', // Default category, could be enhanced
    fundingType,
    fundingToken: metadata.token,
    options,
  }
}

/**
 * Map multiple subgraph polls to FormattedPoll array
 */
export function mapSubgraphPollsToFormattedPolls(polls: SubgraphPoll[]): FormattedPoll[] {
  return polls.map(mapSubgraphPollToFormattedPoll)
}

/**
 * Map subgraph funding to simplified funding
 */
export function mapSubgraphFundingToSimplified(funding: SubgraphFunding): SimplifiedFunding {
  return {
    funder: funding.funder,
    token: funding.token,
    amount: Number(funding.amount) / 1e18, // Convert from wei
    timestamp: new Date(Number(funding.timestamp) * 1000),
  }
}

/**
 * Map multiple subgraph fundings to simplified array
 */
export function mapSubgraphFundingsToSimplified(fundings: SubgraphFunding[]): SimplifiedFunding[] {
  return fundings.map(mapSubgraphFundingToSimplified)
}

/**
 * Get token symbol from token address
 */
export function getTokenSymbol(tokenAddress: string): string {
  const address = tokenAddress.toLowerCase()

  // ETH (zero address)
  if (address === '0x0000000000000000000000000000000000000000') {
    return 'ETH'
  }

  // Base Sepolia tokens
  if (address === '0x19821658d5798976152146d1c1882047670b898c') {
    return 'PULSE'
  }
  if (address === '0x036cbd53842c5426634e7929541ec2318f3dcf7e') {
    return 'USDC'
  }

  // Base Mainnet tokens
  if (address === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913') {
    return 'USDC'
  }

  // Unknown token
  return 'TOKEN'
}
