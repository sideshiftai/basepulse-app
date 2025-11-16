import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useChainId } from 'wagmi'
import { parseEther, formatEther, Address, parseUnits } from 'viem'
import {
  POLLS_CONTRACT_ABI,
  POLLS_CONTRACT_ADDRESSES,
  CONTRACT_FUNCTIONS,
  Poll,
  Funding,
  SupportedChainId,
  FundingType,
} from './polls-contract'
import { ERC20_ABI } from './token-config'

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

  const createPoll = async (question: string, options: string[], durationInHours: number, fundingToken: Address, fundingType: FundingType) => {
    if (!contractAddress) return

    const durationInSeconds = BigInt(durationInHours * 3600) // Convert hours to seconds

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: CONTRACT_FUNCTIONS.CREATE_POLL,
      args: [question, options, durationInSeconds, fundingToken, fundingType],
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

// Hook to fund poll with ERC20 token
export const useFundPollWithToken = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const fundPoll = async (pollId: number, tokenAddress: Address, amount: string, decimals: number) => {
    if (!contractAddress) return

    const parsedAmount = parseUnits(amount, decimals)

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: CONTRACT_FUNCTIONS.FUND_POLL_WITH_TOKEN,
      args: [BigInt(pollId), tokenAddress, parsedAmount],
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

// Hook to approve ERC20 token spending
export const useTokenApproval = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async (tokenAddress: Address, spenderAddress: Address, amount: string, decimals: number) => {
    const parsedAmount = parseUnits(amount, decimals)

    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, parsedAmount],
    })
  }

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook to check ERC20 token balance
export const useTokenBalance = (tokenAddress?: Address, userAddress?: Address) => {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress,
    },
  })
}

// Hook to check ERC20 token allowance
export const useTokenAllowance = (tokenAddress?: Address, ownerAddress?: Address, spenderAddress?: Address) => {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!ownerAddress && !!spenderAddress,
    },
  })
}

// Hook to check if token is whitelisted
export const useIsTokenWhitelisted = (tokenAddress?: Address) => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: 'whitelistedTokens',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!contractAddress && !!tokenAddress,
    },
  })
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
  const [id, question, options, votes, endTime, isActive, creator, totalFunding, distributionMode, fundingToken, fundingType] = pollData

  return {
    id,
    question,
    options,
    votes,
    endTime,
    isActive,
    creator,
    totalFunding,
    fundingToken,
    fundingType,
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

// Hook to set distribution mode
export const useSetDistributionMode = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const setDistributionMode = async (pollId: number, mode: number) => {
    if (!contractAddress) return

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: 'setDistributionMode',
      args: [BigInt(pollId), mode],
    })
  }

  return {
    setDistributionMode,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook to withdraw funds from a poll
export const useWithdrawFunds = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const withdrawFunds = async (pollId: number, recipient: Address, tokens: Address[]) => {
    if (!contractAddress) return

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: 'withdrawFunds',
      args: [BigInt(pollId), recipient, tokens],
    })
  }

  return {
    withdrawFunds,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook to distribute rewards to multiple recipients
export const useDistributeRewards = () => {
  const contractAddress = usePollsContractAddress()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const distributeRewards = async (
    pollId: number,
    token: Address,
    recipients: Address[],
    amounts: bigint[]
  ) => {
    if (!contractAddress) return

    return writeContract({
      address: contractAddress,
      abi: POLLS_CONTRACT_ABI,
      functionName: 'distributeRewards',
      args: [BigInt(pollId), token, recipients, amounts],
    })
  }

  return {
    distributeRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook to get poll token balance
export const usePollTokenBalance = (pollId: number, tokenAddress?: Address) => {
  const contractAddress = usePollsContractAddress()

  return useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: 'getPollTokenBalance',
    args: tokenAddress ? [BigInt(pollId), tokenAddress] : undefined,
    query: {
      enabled: !!contractAddress && !!tokenAddress,
    },
  })
}