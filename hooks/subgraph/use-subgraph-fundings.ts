/**
 * Hook to fetch poll fundings from The Graph subgraph
 */

'use client'

import { useQuery } from '@apollo/client'
import { apolloClient } from '@/lib/graphql/apollo-client'
import { GET_POLL_FUNDINGS } from '@/lib/graphql/queries/polls'
import { mapSubgraphFundingsToSimplified, type SimplifiedFunding } from '@/lib/graphql/mappers'
import type { GetPollFundingsResponse, PollFundingsQueryVariables } from '@/types/subgraph'

export function useSubgraphPollFundings(pollId: string | number, first = 100) {
  // Convert poll ID to bytes format
  const pollIdBytes = `0x${BigInt(pollId).toString(16).padStart(64, '0')}`

  const { data, loading, error, refetch } = useQuery<GetPollFundingsResponse, PollFundingsQueryVariables>(
    GET_POLL_FUNDINGS,
    {
      client: apolloClient,
      variables: { pollId: pollIdBytes, first },
      fetchPolicy: 'cache-and-network',
      skip: !pollId,
    }
  )

  const fundings: SimplifiedFunding[] = data?.fundings
    ? mapSubgraphFundingsToSimplified(data.fundings)
    : []

  // Calculate total funding amount
  const totalFunding = fundings.reduce((sum, f) => sum + f.amountFormatted, 0)

  return {
    fundings,
    totalFunding,
    fundingCount: fundings.length,
    loading,
    error,
    refetch,
  }
}
