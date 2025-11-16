/**
 * Analytics API client for BasePulse
 * Fetches analytics data from basepulse-api
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PollStats {
  totalDistributed: string;
  distributionCount: number;
  uniqueRecipients: number;
}

export interface Distribution {
  id: number;
  pollId: number;
  recipient: string;
  amount: string;
  token: string;
  txHash: string;
  eventType: string;
  timestamp: Date;
}

export interface Funding {
  token: string;
  amount: string;
  funder: string;
  timestamp: Date;
}

export interface TrendDataPoint {
  date: string;
  pollsCreated: number;
  distributionCount: number;
  totalDistributed: string;
}

export interface AnalyticsTrends {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  dailyData: TrendDataPoint[];
}

export interface CreatorOverview {
  totalPolls: number;
  activePolls: number;
  totalResponses: number;
  totalFunded: string;
}

/**
 * Fetch poll statistics
 */
export async function fetchPollStats(pollId: number): Promise<PollStats> {
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch poll stats: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch distribution history for a poll
 */
export async function fetchPollDistributions(pollId: number): Promise<Distribution[]> {
  const response = await fetch(`${API_BASE_URL}/polls/${pollId}/distributions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch distributions: ${response.statusText}`);
  }
  const data = await response.json();
  return data.distributions || [];
}

/**
 * Fetch funding history for a poll
 */
export async function fetchPollFundings(
  chainId: number,
  pollId: number
): Promise<{ totalFunding: string; fundings: Funding[] }> {
  const response = await fetch(
    `${API_BASE_URL}/polls/blockchain/${chainId}/${pollId}/fundings`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch fundings: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch analytics trends over time
 */
export async function fetchAnalyticsTrends(
  chainId?: number,
  days: number = 7
): Promise<AnalyticsTrends> {
  const params = new URLSearchParams({ days: days.toString() });
  if (chainId) {
    params.append('chainId', chainId.toString());
  }

  const response = await fetch(`${API_BASE_URL}/analytics/trends?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trends: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch user-specific statistics from leaderboard
 */
export async function fetchUserStats(address: string): Promise<{
  address: string;
  totalRewards: string;
  pollsParticipated: number;
  totalVotes: number;
  pollsCreated: number;
  rankings: {
    rewards: number;
    votes: number;
    creators: number;
    participation: number;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/leaderboard/user/${address}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user stats: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Compare multiple polls
 */
export async function comparePoll(pollIds: number[]): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/analytics/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pollIds }),
  });

  if (!response.ok) {
    throw new Error(`Failed to compare polls: ${response.statusText}`);
  }
  return response.json();
}
