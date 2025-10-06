import { Address } from 'viem'
import PollsContractABI from './PollsContract.abi.json'

export const POLLS_CONTRACT_ABI = PollsContractABI as const

import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS, getContractAddress } from './contract-config'

// Contract addresses by chain ID
export const POLLS_CONTRACT_ADDRESSES: Record<number, Address> = Object.fromEntries(
  SUPPORTED_CHAINS.map(chainId => [
    chainId,
    getContractAddress(chainId, 'POLLS_CONTRACT') as Address
  ])
) as Record<number, Address>

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS

export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number]

// Contract function names for type safety
export const CONTRACT_FUNCTIONS = {
  // Read functions
  GET_POLL: 'getPoll',
  GET_ACTIVE_POLLS: 'getActivePolls',
  GET_POLL_FUNDINGS: 'getPollFundings',
  HAS_USER_VOTED: 'hasUserVoted',
  GET_USER_FUNDING: 'getUserFunding',
  IS_POLL_ACTIVE: 'isPollActive',
  NEXT_POLL_ID: 'nextPollId',

  // Write functions
  CREATE_POLL: 'createPoll',
  VOTE: 'vote',
  FUND_POLL_WITH_ETH: 'fundPollWithETH',
  FUND_POLL_WITH_TOKEN: 'fundPollWithToken',
  WITHDRAW_FUNDS: 'withdrawFunds',
  CLOSE_POLL: 'closePoll',
  WHITELIST_TOKEN: 'whitelistToken',
} as const

// Event names for listening to contract events
export const CONTRACT_EVENTS = {
  POLL_CREATED: 'PollCreated',
  VOTED: 'Voted',
  POLL_FUNDED: 'PollFunded',
  TOKEN_WHITELISTED: 'TokenWhitelisted',
  FUNDS_WITHDRAWN: 'FundsWithdrawn',
} as const

// Types based on the smart contract
export interface Poll {
  id: bigint
  question: string
  options: string[]
  votes: bigint[]
  endTime: bigint
  isActive: boolean
  creator: Address
  totalFunding: bigint
}

export interface Funding {
  token: Address
  amount: bigint
  funder: Address
  timestamp: bigint
}

// Duration constants from contract
export const MIN_POLL_DURATION = 3600n // 1 hour in seconds
export const MAX_POLL_DURATION = 2592000n // 30 days in seconds