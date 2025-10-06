import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useChainId } from 'wagmi'
import { parseEther, formatEther, Address } from 'viem'
import {
  POLLS_CONTRACT_ABI,
  POLLS_CONTRACT_ADDRESSES,
  CONTRACT_FUNCTIONS,
  Poll,
  Funding,
  SupportedChainId,
} from './polls-contract'

// Custom hook to get contract address for current chain
export const usePollsContractAddress = (): Address | undefined => {
  const chainId = useChainId() as SupportedChainId
  return POLLS_CONTRACT_ADDRESSES[chainId]
}

// Hook to read a single poll
export const usePoll = (pollId: number) => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: CONTRACT_FUNCTIONS.GET_POLL,
    args: [BigInt(pollId)],
    query: {
      enabled: !!contractAddress,
    },
  })
}

// Hook to read all active polls
export const useActivePolls = () => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: CONTRACT_FUNCTIONS.GET_ACTIVE_POLLS,
    query: {
      enabled: !!contractAddress,
    },
  })
}

// Hook to check if user has voted on a poll
export const useHasUserVoted = (pollId: number, userAddress?: Address) => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: CONTRACT_FUNCTIONS.HAS_USER_VOTED,
    args: [BigInt(pollId), userAddress!],
    query: {
      enabled: !!contractAddress && !!userAddress,
    },
  })
}

// Hook to get poll fundings
export const usePollFundings = (pollId: number) => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: CONTRACT_FUNCTIONS.GET_POLL_FUNDINGS,
    args: [BigInt(pollId)],
    query: {
      enabled: !!contractAddress,
    },
  })
}

// Hook to get user's funding amount for a poll
export const useUserFunding = (pollId: number, userAddress?: Address) => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: CONTRACT_FUNCTIONS.GET_USER_FUNDING,
    args: [BigInt(pollId), userAddress!],
    query: {
      enabled: !!contractAddress && !!userAddress,
    },
  })
}

// Hook to check if poll is active
export const useIsPollActive = (pollId: number) => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: CONTRACT_FUNCTIONS.IS_POLL_ACTIVE,
    args: [BigInt(pollId)],
    query: {
      enabled: !!contractAddress,
    },
  })
}

// Hook to get next poll ID
export const useNextPollId = () => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: CONTRACT_FUNCTIONS.NEXT_POLL_ID,
    query: {
      enabled: !!contractAddress,
    },
  })
}

// Write contract hooks
export const useCreatePoll = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const createPoll = async (question: string, options: string[], durationInHours: number) => {
    if (!contractAddress) return

    const durationInSeconds = BigInt(durationInHours * 3600) // Convert hours to seconds

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: CONTRACT_FUNCTIONS.CREATE_POLL,
      args: [question, options, durationInSeconds],
    })
  }

  return {
    createPoll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook to vote on a poll
export const useVote = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const vote = async (pollId: number, optionIndex: number) => {
    if (!contractAddress) return

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: CONTRACT_FUNCTIONS.VOTE,
      args: [BigInt(pollId), BigInt(optionIndex)],
    })
  }

  return {
    vote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook to fund poll with ETH
export const useFundPollWithETH = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const fundPoll = async (pollId: number, ethAmount: string) => {
    if (!contractAddress) return

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: CONTRACT_FUNCTIONS.FUND_POLL_WITH_ETH,
      args: [BigInt(pollId)],
      value: parseEther(ethAmount),
    })
  }

  return {
    fundPoll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook to close a poll (only creator or owner)
export const useClosePoll = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const closePoll = async (pollId: number) => {
    if (!contractAddress) return

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: CONTRACT_FUNCTIONS.CLOSE_POLL,
      args: [BigInt(pollId)],
    })
  }

  return {
    closePoll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Helper functions to format contract data
export const formatPollData = (pollData: any): Poll => {
  const [id, question, options, votes, endTime, isActive, creator, totalFunding] = pollData

  return {
    id,
    question,
    options,
    votes,
    endTime,
    isActive,
    creator,
    totalFunding,
  }
}

export const formatFundingData = (fundingData: any[]): Funding[] => {
  return fundingData.map((funding) => ({
    token: funding.token,
    amount: funding.amount,
    funder: funding.funder,
    timestamp: funding.timestamp,
  }))
}

// Helper to convert BigInt to readable format
export const formatVotes = (votes: bigint): number => {
  return Number(votes)
}

export const formatETH = (wei: bigint): string => {
  return formatEther(wei)
}

export const formatTimestamp = (timestamp: bigint): Date => {
  return new Date(Number(timestamp) * 1000)
}