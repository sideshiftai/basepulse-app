import { useState, useEffect } from 'react'
import { useActivePolls, usePoll, formatPollData, formatVotes, formatETH, formatTimestamp } from '@/lib/contracts/polls-contract-utils'
import { Address } from 'viem'

export interface FormattedPoll {
  id: string
  title: string
  description?: string
  creator: Address
  createdAt: string
  endsAt: string
  totalVotes: number
  totalReward: number
  status: 'active' | 'ended'
  category: string
  fundingType: 'community' | 'self' | 'none'
  options: Array<{
    id: string
    text: string
    votes: number
    percentage: number
  }>
}

// Hook to get and format all active polls
export const useFormattedActivePolls = () => {
  const { data: activePollIds, isLoading, error } = useActivePolls()
  const [polls, setPolls] = useState<FormattedPoll[]>([])
  const [pollsLoading, setPollsLoading] = useState(false)

  useEffect(() => {
    const fetchPollData = async () => {
      if (!activePollIds || activePollIds.length === 0) {
        setPolls([])
        return
      }

      setPollsLoading(true)
      try {
        // This would need to be implemented with multiple useReadContract calls
        // For now, returning empty array as this requires more complex data fetching
        setPolls([])
      } catch (err) {
        console.error('Error fetching poll data:', err)
      } finally {
        setPollsLoading(false)
      }
    }

    fetchPollData()
  }, [activePollIds])

  return {
    polls,
    isLoading: isLoading || pollsLoading,
    error,
  }
}

// Hook to get a single formatted poll
export const useFormattedPoll = (pollId: number) => {
  const { data: pollData, isLoading, error } = usePoll(pollId)
  const [formattedPoll, setFormattedPoll] = useState<FormattedPoll | null>(null)

  useEffect(() => {
    if (pollData) {
      const formatted = formatPollData(pollData)
      const totalVotes = formatted.votes.reduce((sum, votes) => sum + formatVotes(votes), 0)

      const options = formatted.options.map((option, index) => {
        const votes = formatVotes(formatted.votes[index])
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

        return {
          id: `${formatted.id}-${index}`,
          text: option,
          votes,
          percentage,
        }
      })

      const formattedPollData: FormattedPoll = {
        id: formatted.id.toString(),
        title: formatted.question,
        creator: formatted.creator,
        createdAt: new Date().toISOString(), // We don't have creation time in contract
        endsAt: formatTimestamp(formatted.endTime).toISOString(),
        totalVotes,
        totalReward: parseFloat(formatETH(formatted.totalFunding)),
        status: formatted.isActive && Date.now() < Number(formatted.endTime) * 1000 ? 'active' : 'ended',
        category: 'Governance', // Default category, could be enhanced
        fundingType: formatted.totalFunding > 0n ? 'community' : 'none',
        options,
      }

      setFormattedPoll(formattedPollData)
    }
  }, [pollData])

  return {
    poll: formattedPoll,
    isLoading,
    error,
  }
}