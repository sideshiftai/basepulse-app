# Wave 3 Summary - Part 2: Quadratic Voting & Premium Features

**Project:** BasePulse / SideShift Pulse
**Wave:** 3 (Continuation)
**Period:** December 2025
**Repositories:** basepulse-app, basepulse-api, basepulse-contract, basepulse-subgraph, basepulse-cron

---

## Overview

This document covers the second phase of Wave 3 development, focusing on **Quadratic Voting**, **Premium Subscriptions**, **Staking**, and various UX improvements including a multi-step poll creation wizard and quest progress tracking fixes.

---

## Major Features Implemented

### 1. Quadratic Voting System

A new voting mechanism where vote cost increases quadratically, promoting fairer influence distribution.

#### How It Works
- Cost formula: `n² PULSE tokens` for n votes (1st vote = 1, 2nd = 4, 3rd = 9...)
- Voters purchase votes using PULSE tokens
- Only available to Premium/Staked users (creators)
- Prevents vote buying and whale dominance

#### Smart Contract Changes (`PollsContract.sol`)
```solidity
enum VotingType { LINEAR, QUADRATIC }

// New functions
function buyVotes(uint256 pollId, uint256 optionIndex, uint256 numVotes) external
function calculateVoteCost(uint256 currentVotes, uint256 additionalVotes) public pure returns (uint256)

// New events
event VotesBought(uint256 indexed pollId, address indexed voter, uint256 optionIndex, uint256 numVotes, uint256 cost, uint256 timestamp)
```

#### Frontend Components
- `QuadraticVotePanel` - Vote purchasing UI with cost calculator
- Voting type selection in poll creation form (Linear/Quadratic)
- Premium badge indicator for quadratic voting access

---

### 2. Premium Subscription System

A tiered subscription system using PULSE tokens for enhanced features.

#### Subscription Tiers
| Tier | Price (PULSE) | Duration | Features |
|------|---------------|----------|----------|
| **Basic** | 100 | 30 days | Basic premium features |
| **Pro** | 250 | 30 days | All Basic + Quadratic voting |
| **Enterprise** | 500 | 30 days | All Pro + Priority support |

#### Smart Contract (`PremiumContract.sol`)
```solidity
// Core functions
function subscribe(uint8 tier) external
function isSubscribed(address user) external view returns (bool)
function getSubscription(address user) external view returns (Subscription memory)
function isPremiumOrStaked(address user) external view returns (bool)

// Events
event Subscribed(address indexed user, uint8 tier, uint256 expiry, uint256 amount, uint256 timestamp)
event SubscriptionRenewed(address indexed user, uint8 tier, uint256 newExpiry, uint256 amount, uint256 timestamp)
```

---

### 3. PULSE Token Staking

Stake PULSE tokens to unlock premium features without paying subscription fees.

#### Staking Requirements
- **Minimum stake:** 10,000 PULSE tokens
- **Lock period:** 30 days minimum
- **Benefits:** Full premium access while staked

#### Smart Contract (`StakingContract.sol`)
```solidity
// Core functions
function stake(uint256 amount) external
function unstake() external
function getStake(address user) external view returns (Stake memory)
function isStaked(address user) external view returns (bool)
function canUnstake(address user) external view returns (bool)

// Events
event Staked(address indexed user, uint256 amount, uint256 unlockTime, uint256 timestamp)
event Unstaked(address indexed user, uint256 amount, uint256 timestamp)
```

---

### 4. Multi-Step Poll Creation Wizard

Converted the poll creation form from a single vertical form to an intuitive 3-step wizard.

#### Steps
1. **Basic Info** - Title, description, category, end date
2. **Options** - Poll choices (2-10) with live preview
3. **Settings** - Voting type (Linear/Quadratic) & Funding options

#### Features
- Step validation before proceeding
- Back/Next navigation
- Visual stepper progress indicator
- Premium gating for quadratic voting
- Live preview of poll options

---

### 5. Quest Progress Tracking Fix

Fixed critical bug where quest progress wasn't updating after successful votes.

#### Root Cause
Frontend was not calling the progress increment API after successful vote transactions.

#### Fix Applied
- Added `updateQuestProgress` API call in `InlineVotingCard` after successful vote
- Dialog auto-closes after progress update
- Quest list refreshes to show updated progress

#### Files Modified
- `components/participant/quests/dialog-content/inline-voting-card.tsx`
- `components/participant/quests/dialog-content/vote-on-polls-content.tsx`
- `components/participant/quests/dialog-content/participate-in-polls-content.tsx`
- `components/participant/quests/dialog-content/first-n-voters-content.tsx`
- `components/participant/quests/dialog-content/vote-on-specific-poll-content.tsx`
- `components/participant/quests/available-quests-list.tsx`

---

### 6. Subgraph Syncing Fix (v0.2.2)

Fixed critical subgraph syncing error caused by ABI compatibility issues.

#### Error
```
overflow converting 0x...434453553a4e454b4f547c6c6c6f502074736554 to i32
```

#### Root Cause
The `handlePollCreated` handler was calling `contract.try_getPoll()` which failed on older contract versions with different return structures.

#### Fix Applied
- Removed `getPoll` contract call from `handlePollCreated`
- Uses only event parameters and default values
- Moved quadratic poll counting to `handleVotesBought` handler
- Polls marked as `QUADRATIC` when first `VotesBought` event is received

---

### 7. Creator Dashboard Enhancements

#### Manage Polls Tab
- View all created polls with status indicators
- Pending distributions view for ended polls
- Batch distribution wizard for reward distribution

#### New Components
- `ManagePollsTab` - Poll management interface
- `PollCard` - Enhanced poll card with distribution actions
- `BatchDistributeWizard` - Multi-step distribution wizard

---

### 8. Participant Pages

Complete participant experience for quest completion and rewards.

#### Pages
- `/participant/quests` - Available quests dashboard
- `/participant/points` - Points history and balance
- `/participant/rewards` - PULSE rewards and claiming
- `/participant/membership` - Tier progression

#### Quest Dialog Components
- `QuestActionDialog` - Main quest interaction dialog
- `InlineVotingCard` - Embedded voting within quest context
- Content components for each quest type

---

### 9. AI Chatbox Improvements

Updated the example prompt to showcase BasePulse features:

**Before:** `"Create a poll about favorite programming languages"`

**After:** `"Create for me a poll about what features to build next for Base Pulse. Collect responses for 1 week. Fund the poll with 0.01 ETH using SideShift and split the rewards equally to max of 10 respondents."`

---

## New Files Created

### Smart Contracts (basepulse-contract)

```
contracts/PremiumContract.sol     # Premium subscriptions
contracts/StakingContract.sol     # PULSE staking
scripts/deploy-premium.ts         # Premium deployment
scripts/deploy-staking.ts         # Staking deployment
test/PremiumContract.test.ts      # Premium tests
test/StakingContract.test.ts      # Staking tests
test/QuadraticVoting.test.ts      # QV tests
```

### Subgraph (basepulse-subgraph)

```
schema.graphql                    # Added Stake, PremiumSubscription, QV entities
src/mapping.ts                    # Updated handlers, fixed syncing
src/helpers/constants.ts          # Added QV constants
```

### Frontend (basepulse-app)

```
components/ui/stepper.tsx                    # Step progress indicator
components/creator/batch-distribute-wizard.tsx  # Distribution wizard
hooks/use-poll-token-balances.ts             # Poll balance fetching
hooks/subgraph/use-subgraph-poll-voters.ts   # Voter data from subgraph
lib/contracts/premium-contract.ts            # Premium contract utils
lib/contracts/premium-contract-utils.ts      # Premium hooks
lib/contracts/staking-contract.ts            # Staking contract utils
```

### Backend (basepulse-api)

```
src/services/staking.service.ts      # Staking event handling
src/services/premium.service.ts      # Premium subscription handling
```

---

## Contract Deployments

### Base Sepolia (Testnet)

| Contract | Address |
|----------|---------|
| PollsContract | `0xdfb6881ad34F26D57c3146d335848EDba21dFb6f` |
| PremiumContract | *Deployed* |
| StakingContract | *Deployed* |
| PULSE Token | *Configured* |

---

## Subgraph Versions

| Version | Changes |
|---------|---------|
| v0.2.0 | Initial QV and staking support |
| v0.2.1 | Fixed reserved type name (Subscription → PremiumSubscription) |
| v0.2.2 | Fixed syncing error (removed getPoll call) |

---

## API Endpoints (New/Modified)

### Premium & Staking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/premium/:address` | Get subscription status |
| GET | `/api/staking/:address` | Get staking status |
| GET | `/api/premium/is-premium/:address` | Check premium access |

### AI Poll Creation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-poll` | AI-assisted poll creation |

---

## Database Schema Updates

### New Tables (via Drizzle)
- Premium subscription tracking
- Staking records
- QV vote purchases

---

## Testing

### Contract Tests
```bash
cd basepulse-contract
npx hardhat test test/PremiumContract.test.ts
npx hardhat test test/StakingContract.test.ts
npx hardhat test test/QuadraticVoting.test.ts
```

### E2E Testing Completed
- [x] Quest progress tracking after voting
- [x] Multi-step poll creation flow
- [x] Premium subscription flow
- [x] Staking flow
- [x] Quadratic voting (pending full test)

---

## Known Issues / Future Work

- [ ] Quadratic voting cost display in vote confirmation
- [ ] Staking rewards distribution
- [ ] Premium tier feature differentiation UI
- [ ] Automated season end processing
- [ ] Push notifications for quest completion

---

## Git Commits Summary

### basepulse-app
- `7a61c93` - multi-step form; change ai chatbox prompt
- `51a4380` - bug fix for quest point not displaying
- `3051640` - update contract addresses for PULSE token
- `e1cc849` - add premium and staking pages
- `8416775` - initial commit for quadratic voting and premium subscriptions
- `da896a7` - easy UX to accomplish quests
- `2ab89d4` - Phase 4: Pending Distributions View for Creators

### basepulse-contract
- `4e5d83c` - add premium subscription and staking contract scripts
- `404d60a` - add tests for premium subscription, quadratic voting, and staking
- `0d71d0d` - add premium subscription and staking
- `480f14f` - update contract to include status field

### basepulse-subgraph
- `05c8af8` - sync error fix (v0.2.2)
- `c3bcf8b` - subgraph deploy error fix
- `f6841a8` - add premium subscriptions and staking

### basepulse-api
- `c209fdc` - add new event listeners
- `1e53794` - initial version of staking and premium accounts API
- `c4f438e` - ai api - add shift when needed

---

## Contributors

- SideShift AI Team

---

## Links

- **Main App:** https://pulse.sideshift.ai
- **API:** https://api.pulse.sideshift.ai
- **Subgraph:** The Graph Studio (basepulse-testnet)
- **Contracts:** Base Sepolia Explorer
