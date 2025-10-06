# BasePuls3 Smart Contract Integration Setup

This document explains how to complete the integration between the BasePuls3 smart contract and the frontend application.

## Overview

The integration has been implemented with the following components:

1. **Contract Constants & ABI** (`lib/contracts/polls-contract.ts`)
2. **Contract Utilities & Hooks** (`lib/contracts/polls-contract-utils.ts`)
3. **Configuration** (`lib/contracts/contract-config.ts`)
4. **React Hooks** (`hooks/use-polls.ts`)
5. **Updated Components** (dapp page and poll creation form)

## Required Steps to Complete Integration

### 1. Deploy the Smart Contract

First, you need to deploy the `PollsContract` to your target networks.

#### For Base Sepolia (Testnet):
```bash
cd ../basepuls3-contracts
npm run deploy:sepolia
```

#### For Base Mainnet:
```bash
cd ../basepuls3-contracts
npm run deploy:mainnet
```

### 2. Update Contract Addresses

After deployment, update the contract addresses in `lib/contracts/contract-config.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  // Base Mainnet (chainId: 8453)
  8453: {
    POLLS_CONTRACT: '0xYOUR_DEPLOYED_ADDRESS_HERE', // Replace with actual address
  },
  // Base Sepolia Testnet (chainId: 84532)
  84532: {
    POLLS_CONTRACT: '0xYOUR_DEPLOYED_ADDRESS_HERE', // Replace with actual address
  },
} as const
```

### 3. Environment Configuration

Create or update your `.env.local` file:

```env
# Set to 'true' to use mock data when contracts are not available
NEXT_PUBLIC_USE_MOCK_DATA=false

# Optional: Override default chain selection
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
```

### 4. Test the Integration

1. **Start the frontend:**
   ```bash
   npm run dev
   ```

2. **Connect a wallet** with Base or Base Sepolia network

3. **Test poll creation:**
   - Navigate to `/dapp/create`
   - Fill out the form
   - Submit to create a poll on-chain

4. **Test poll display:**
   - Navigate to `/dapp`
   - Verify polls are loaded from the contract

## Smart Contract Functions Available

### Read Functions
- `getPoll(pollId)` - Get poll details
- `getActivePolls()` - Get all active poll IDs
- `hasUserVoted(pollId, userAddress)` - Check if user voted
- `getPollFundings(pollId)` - Get poll funding details
- `isPollActive(pollId)` - Check if poll is active

### Write Functions
- `createPoll(question, options, duration)` - Create a new poll
- `vote(pollId, optionIndex)` - Vote on a poll
- `fundPollWithETH(pollId)` - Fund poll with ETH
- `closePoll(pollId)` - Close a poll (creator/owner only)

## Frontend Features Implemented

### 1. Dapp Page (`app/dapp/page.tsx`)
- ✅ Connects to smart contract
- ✅ Displays contract stats (total polls, active polls)
- ✅ Shows loading states
- ✅ Fallback to mock data when contract unavailable
- ✅ Wallet connection status indicators

### 2. Poll Creation Form (`components/poll-creation-form.tsx`)
- ✅ Validates poll duration against contract limits
- ✅ Creates polls on-chain
- ✅ Transaction status indicators
- ✅ Wallet connection checks
- ✅ Contract availability checks

### 3. Contract Utilities
- ✅ wagmi hooks for all contract interactions
- ✅ Type-safe contract calls
- ✅ Error handling
- ✅ Transaction status tracking

## Wagmi Configuration

The app already includes wagmi and viem setup. Ensure your `wagmi.config.ts` or provider includes Base networks:

```typescript
import { base, baseSepolia } from 'wagmi/chains'

// In your wagmi config
chains: [base, baseSepolia]
```

## Contract Verification

After deployment, verify your contracts on Basescan:

```bash
# For Sepolia
npm run verify:sepolia -- YOUR_CONTRACT_ADDRESS

# For Mainnet
npm run verify:mainnet -- YOUR_CONTRACT_ADDRESS
```

## Troubleshooting

### Contract Not Found Error
- Ensure the contract address is correctly set in `contract-config.ts`
- Verify the network matches your wallet's current network
- Check that the contract is deployed on the selected network

### Transaction Failures
- Ensure the connected wallet has sufficient ETH for gas
- Check that poll parameters meet contract requirements (duration, options count)
- Verify the poll hasn't already ended if trying to vote

### Mock Data Fallback
If contracts aren't deployed yet, the app will show demo polls. This is expected behavior and can be controlled via the `NEXT_PUBLIC_USE_MOCK_DATA` environment variable.

## Next Steps

1. Deploy contracts to desired networks
2. Update contract addresses in config
3. Test thoroughly on testnet before mainnet deployment
4. Consider adding more advanced features:
   - Poll details page
   - Voting functionality
   - Poll funding with ETH/tokens
   - Real-time updates via contract events

## File Structure

```
lib/contracts/
├── polls-contract.ts           # Contract constants and types
├── polls-contract-utils.ts     # wagmi hooks and utilities
├── contract-config.ts          # Deployment addresses config
└── PollsContract.abi.json     # Contract ABI

hooks/
└── use-polls.ts               # Custom React hooks

app/dapp/
├── page.tsx                   # Main dapp page
└── create/page.tsx           # Poll creation page

components/
├── poll-creation-form.tsx     # Poll creation form
├── poll-card.tsx             # Poll display component
└── poll-filters.tsx          # Poll filtering component
```

The integration is now complete and ready for contract deployment!