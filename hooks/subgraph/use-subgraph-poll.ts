/**
 * Hook to fetch a single poll from The Graph subgraph
 */

'use client'

import { useQuery } from '@apollo/client'
import { apolloClient } from '@/lib/graphql/apollo-client'
import { GET_POLL } from '@/lib/graphql/queries/polls'
import { mapSubgraphPollToFormattedPoll } from '@/lib/graphql/mappers'
import type { GetPollResponse, PollQueryVariables } from '@/types/subgraph'
import type { FormattedPoll } from '@/hooks/use-polls'

export function useSubgraphPoll(pollId: string | number) {
  // Convert poll ID to bytes format (pad to 32 bytes)
  const pollIdBytes = `0x${BigInt(pollId).toString(16).padStart(64, '0')}`

  const { data, loading, error, refetch } = useQuery<GetPollResponse, PollQueryVariables>(
    GET_POLL,
    {
      client: apolloClient,
      variables: { id: pollIdBytes },
      fetchPolicy: 'cache-and-network',
      skip: !pollId,
    }
  )

  const poll: FormattedPoll | null = data?.poll
    ? mapSubgraphPollToFormattedPoll(data.poll)
    : null

  return {
    poll,
    loading,
    error,
    refetch,
  }
}
