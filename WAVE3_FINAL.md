# SideShift Pulse - Wave 3 Final Submission

**Project:** SideShift Pulse (formerly BasePulse)
**Wave:** 3 - Akindo WaveHack Buildathon
**Period:** November 7 - December 14, 2025
**Team:** SideShift AI

---

## Abstract

Wave 3 of SideShift Pulse delivers a comprehensive suite of features that transform the platform from a simple polling dApp into a full-fledged community engagement and rewards ecosystem. Building upon the SideShift integration established in previous waves, we have implemented **Quadratic Voting** with PULSE token economics, a **Premium Subscription System** paid in PULSE, **PULSE Token Staking** for premium access, a complete **Creator Quest System** with seasons and tiered memberships, and an **AI-Powered Poll Creation** assistant. Throughout these features, SideShift's cross-chain bridging capabilities are deeply integrated, enabling users to convert any cryptocurrency into PULSE tokens to participate in subscriptions, staking, quadratic voting, and poll funding.

The development spans 112 commits across four repositories, introducing 3 new smart contracts deployed on Base Mainnet, 15+ new API endpoints, and a significantly enhanced user experience with multi-step wizards, real-time analytics dashboards, and gamified participation incentives.

---

## Key SideShift Integration Points

SideShift's bridging technology is woven throughout the new features, making PULSE tokens accessible to users regardless of which cryptocurrency they hold:

1. **Premium Subscription via SideShift Bridge**: Users can purchase premium subscriptions using any supported cryptocurrency (BTC, ETH, USDC, and 100+ others). The integrated bridge converts their tokens to PULSE automatically, which is then used to pay for Monthly, Annual, or Lifetime subscriptions.

2. **Direct PULSE Purchase Page**: A dedicated `/buy-pulse` page allows users to acquire PULSE tokens using ETH or USDC directly, or bridge any external cryptocurrency via SideShift. The page features real-time price calculations, wallet balance display, and automatic USDC allowance detection.

3. **Premium Upgrade Flow**: The new `/upgrade` page guides users through the premium subscription process with built-in SideShift bridge access. Users see their current PULSE balance and can instantly bridge more tokens if needed before subscribing.

4. **Quadratic Voting Token Acquisition**: When purchasing votes in quadratic voting polls, users who lack sufficient PULSE can bridge tokens directly through the integrated SideShift widget without leaving the voting interface.

5. **Poll Funding with Cross-Chain Assets**: Creators can fund polls with PULSE obtained through SideShift, enabling anyone to become a poll sponsor regardless of their native token holdings.

6. **AI-Generated Polls with SideShift Funding**: The AI chatbox can generate complete poll configurations including SideShift-powered funding instructions, making it effortless to create and fund polls in a single conversation.

---

## Major Features Delivered

### 1. Quadratic Voting System

A fair voting mechanism where vote cost increases quadratically, preventing whale dominance and promoting democratic participation.

**Technical Implementation:**
- Vote cost formula: `n² PULSE tokens` for n votes (1st = 1, 2nd = 4, 3rd = 9...)
- Smart contract function `buyVotes(pollId, optionIndex, numVotes)` handles token transfers
- `calculateVoteCost(currentVotes, additionalVotes)` provides real-time cost calculation
- New `VotesBought` event for subgraph indexing

**User Experience:**
- Creators select "Quadratic Voting" when creating polls (premium feature)
- Voters see cost breakdown before purchasing votes
- Live cost calculator shows cumulative expense
- Insufficient PULSE triggers SideShift bridge prompt

**Smart Contract Events:**
```solidity
event VotesBought(uint256 indexed pollId, address indexed voter, uint256 optionIndex, uint256 numVotes, uint256 cost, uint256 timestamp);
```

---

### 2. Premium Subscription System

A tiered subscription model using PULSE tokens, unlocking advanced features like quadratic voting and creator quest creation.

**Subscription Tiers:**
| Tier | Price (PULSE) | Duration | Features |
|------|---------------|----------|----------|
| Monthly | 1,000 | 30 days | Quadratic voting, early access |
| Annual | 10,000 | 365 days | All Monthly + priority support |
| Lifetime | 50,000 | Forever | All features permanently |

**SideShift Integration:**
- "Bridge Crypto to PULSE" button appears when balance is insufficient
- `PremiumShiftDialog` component opens SideShift widget for instant conversion
- Automatic balance refresh after successful bridge
- Testnet warning displayed on Base Sepolia (bridging unavailable)

**Smart Contract Functions:**
```solidity
function subscribe(uint8 tier) external;
function extendSubscription(uint8 tier) external;
function isSubscribed(address user) external view returns (bool);
function isPremiumOrStaked(address user) external view returns (bool);
```

---

### 3. PULSE Token Staking

An alternative path to premium access through token staking, rewarding long-term commitment.

**Staking Mechanics:**
- Minimum stake: 10,000 PULSE tokens
- Lock period: 30 days
- Benefits: Full premium access while staked
- Unstaking available after lock period expires

**Smart Contract:**
```solidity
function stake(uint256 amount) external;
function unstake() external;
function getStake(address user) external view returns (Stake memory);
function canUnstake(address user) external view returns (bool);
```

**Events:**
```solidity
event Staked(address indexed user, uint256 amount, uint256 unlockTime, uint256 timestamp);
event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
```

---

### 4. Creator Quest System

A complete gamification framework enabling creators to engage their audience through quests, seasons, and rewards.

**Quest Types:**
- `vote_on_polls` - Vote on X polls by creator
- `vote_on_specific_poll` - Vote on specific poll(s)
- `share_poll` - Share poll on social media
- `first_n_voters` - Be among first N voters
- `participate_n_polls` - Participate in N polls

**11 Quest Templates:**
- First Vote, Active Voter, Poll Enthusiast, Super Voter
- Early Bird, First 50 Club, Century Club
- Community Builder, Social Champion
- Poll Explorer, Dedicated Participant

**Seasons/Tournaments:**
- Time-bound seasons with PULSE token pools
- Automatic status lifecycle (upcoming → active → ended → distributed)
- Leaderboard rankings by points
- PULSE distribution at season end

**Tiered Membership System:**
| Tier | Daily Votes | Max Points | Requirements |
|------|-------------|------------|--------------|
| Bronze | 3/day | 1,000 | Default |
| Silver | 6/day | 5,000 | 10 polls, 50 votes |
| Gold | 9/day | 15,000 | 50 polls, 200 votes |
| Platinum | 12/day | 50,000 | 100 polls, 500 votes |

---

### 5. Multi-Step Poll Creation Wizard

A redesigned poll creation experience replacing the single-page form with an intuitive 3-step wizard.

**Steps:**
1. **Basic Info** - Title, description, category, end date
2. **Options** - Poll choices (2-10) with live preview
3. **Settings** - Voting type (Linear/Quadratic), funding options

**Features:**
- Step validation before proceeding
- Back/Next navigation with keyboard support
- Visual stepper progress indicator
- Premium gating for quadratic voting
- Form state persistence between steps

---

### 6. AI-Powered Poll Creation

An intelligent assistant that generates complete poll configurations from natural language descriptions.

**Capabilities:**
- Generates poll title, description, and options
- Suggests appropriate categories and duration
- Recommends funding amounts and distribution modes
- Can trigger SideShift bridge when funding is needed

**Example Prompt:**
> "Create a poll about what features to build next for Base Pulse. Collect responses for 1 week. Fund the poll with 0.01 ETH using SideShift and split the rewards equally to max of 10 respondents."

**Technical Stack:**
- Backend: Anthropic Claude API integration
- Frontend: Floating chatbox with conversation history
- Actions: Direct poll creation from AI suggestions

---

### 7. Creator Dashboard Enhancements

Comprehensive analytics and management tools for poll creators.

**Features:**
- **Responses Overview Chart** - Bar chart of response distribution
- **Responses Over Time Chart** - Timeline with daily/weekly views
- **Dashboard Stats** - Total polls, responses, active polls, funding
- **Pending Distributions Card** - Polls awaiting reward distribution
- **Manage Polls Tab** - Full CRUD for created polls

**Data Sources:**
- The Graph subgraph for on-chain data
- Backend API for analytics trends
- Real-time blockchain event syncing

---

### 8. Premium Upgrade Experience

A streamlined flow for upgrading to premium with integrated SideShift bridging.

**Flow:**
1. User visits `/upgrade` page
2. Current PULSE and ETH balances displayed
3. Subscription tiers shown with pricing
4. "Bridge Crypto to PULSE" button if insufficient balance
5. SideShift widget opens for token conversion
6. Approval flow for PULSE spending
7. Subscription transaction execution
8. Success dialog with navigation options

**Post-Subscription Dialog:**
- Congratulations message with tier details
- Navigation buttons (Creator Dashboard, Participant Dashboard, Main App)
- 5-second auto-redirect to main app

---

### 9. Direct Token Sale Integration

A dedicated page for purchasing PULSE tokens using ETH or USDC.

**Features:**
- Two-way auto-calculation (payment ↔ PULSE amount)
- Real-time wallet balance display
- "Max" buttons for convenience
- USDC allowance detection with approval flow
- SideShift bridge fallback for external tokens

**Technical Details:**
- `DirectTokenSale` smart contract for ETH/USDC → PULSE
- Price feeds from contract state
- Automatic slippage handling

---

## Smart Contract Deployments

### Base Mainnet (Chain ID: 8453)

| Contract | Type | Address | Status |
|----------|------|---------|--------|
| **PollsContract** | Proxy | `0x347523632Ae55D6Da81Da0799f9bd5b3FDd54C6B` | Verified |
| PollsContract | Implementation | `0x7119eedad84c6a79ea7ab7cd1ea68fea6e0865ed` | Verified |
| **PULSE Token** | ERC20 | `0x1b684A60309b0916C77834d62d117d306171FDFE` | Verified |
| **StakingContract** | Proxy | `0xC84377d58747423E1a07505512Adf99A90F86051` | Verified |
| StakingContract | Implementation | `0xde45219792494a130c707B426508Af4DAb4B93C8` | Verified |
| **PremiumContract** | Proxy | `0x69353b25FdAE19d5Bb40D173193AFa34f02da97A` | Verified |
| PremiumContract | Implementation | `0xDef4BA47F81AfFc6496C60ABf4F9E0DfF14FBa1B` | Verified |
| **DirectTokenSale** | Standard | `0xba6Ae648738969A66e7Fc014fc871E41827e7734` | Verified |

### Base Sepolia Testnet (Chain ID: 84532)

| Contract | Type | Address | Status |
|----------|------|---------|--------|
| **PollsContract** | Proxy | `0xdfb6881ad34F26D57c3146d335848EDba21dFb6f` | Verified |
| PollsContract | Implementation | `0xa90e4C8Ae9fcd13c2573bf96025aEF6cc6E63296` | Verified |
| **PULSE Token** | ERC20 | `0x19821658D5798976152146d1c1882047670B898c` | Verified |
| **StakingContract** | Proxy | `0xAc8BA012138c9e8bEdF7BbbeD408105EB195Daaf` | Verified |
| StakingContract | Implementation | `0xa4B3164D632698fc1F7FE3e20B35c0b077c96817` | Verified |
| **PremiumContract** | Proxy | `0xDC6E8482A3292BEd6e86b73B6a39abD60076165F` | Verified |
| PremiumContract | Implementation | `0xBd2Dd8a7077D88CF32cB3536ee1a14a208B71D84` | Verified |
| **DirectTokenSale** | Standard | `0x434d0fDd72AA670a229294E93D0933Ea685802fd` | Verified |

### External Dependencies

| Token | Network | Address |
|-------|---------|---------|
| USDC | Base Mainnet | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| USDC | Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

**Notes:**
- All proxy contracts use the UUPS (Universal Upgradeable Proxy Standard) pattern
- Deployer address: `0x5F565baE36bd373797afc1682a627Cc05CC28600`

---

## API Endpoints Added

### Premium & Staking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/premium/:address` | Subscription status |
| GET | `/api/staking/:address` | Staking status |
| GET | `/api/premium/is-premium/:address` | Check access |

### Creator Quests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/creator-quests` | Create quest |
| GET | `/api/creator-quests/creator/:address` | List quests |
| POST | `/api/creator-quests/:id/progress` | Update progress |

### Seasons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seasons/active` | Active seasons |
| GET | `/api/seasons/:id/leaderboard` | Rankings |
| POST | `/api/seasons/:id/calculate-distribution` | Calculate rewards |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Global stats |
| GET | `/api/analytics/trends` | Timeline data |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-poll` | AI poll creation |

---

## Subgraph Updates

**Version History:**
- v0.2.0 - Initial QV and staking support
- v0.2.1 - Fixed reserved type name issue
- v0.2.2 - Fixed syncing error (removed getPoll call)

**New Entities:**
- `Stake` - Staking records
- `PremiumSubscription` - Subscription status
- `VotePurchase` - Quadratic vote purchases

---

## Development Statistics

| Metric | Count |
|--------|-------|
| Total Commits | 112 |
| New Smart Contracts | 3 |
| New API Endpoints | 15+ |
| New Frontend Components | 30+ |
| New Database Tables | 8 |
| Repositories Updated | 4 |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SideShift Pulse                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                          │
│  ├── Wagmi + Viem (Web3)                                    │
│  ├── Apollo Client (Subgraph)                               │
│  ├── SideShift SDK (Bridging)                               │
│  └── Recharts (Analytics)                                    │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Express)                                       │
│  ├── Drizzle ORM (PostgreSQL)                               │
│  ├── Event Listener (Viem)                                  │
│  ├── Anthropic API (AI)                                     │
│  └── SideShift API (Shifts)                                 │
├─────────────────────────────────────────────────────────────┤
│  Smart Contracts (Solidity)                                  │
│  ├── PollsContract (Voting + QV)                            │
│  ├── PremiumContract (Subscriptions)                        │
│  ├── StakingContract (PULSE Staking)                        │
│  └── DirectTokenSale (ETH/USDC → PULSE)                     │
├─────────────────────────────────────────────────────────────┤
│  The Graph (Subgraph)                                        │
│  └── Indexes all contract events                             │
├─────────────────────────────────────────────────────────────┤
│  SideShift Integration Points                                │
│  ├── Premium subscription payments                           │
│  ├── Quadratic vote token acquisition                        │
│  ├── Direct PULSE token purchase                             │
│  ├── Poll funding with bridged assets                        │
│  └── AI-assisted poll funding                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Live Deployment

- **Main Application:** https://pulse.sideshift.ai
- **API Server:** https://api.pulse.sideshift.ai
- **Network:** Base Mainnet (Chain ID: 8453)
- **Testnet:** Base Sepolia (Chain ID: 84532)

---

## Summary

Wave 3 transforms SideShift Pulse into a comprehensive community engagement platform where PULSE tokens power every interaction. From quadratic voting that ensures fair influence distribution, to premium subscriptions and staking that reward committed users, to creator quests that gamify participation—SideShift's cross-chain bridging makes all of this accessible to users regardless of which cryptocurrency they hold.

The integration points are deliberate and user-centric: when a user lacks PULSE for any action, the SideShift bridge is immediately available to convert their assets. This seamless experience removes friction and expands the potential user base to anyone in the crypto ecosystem.

With 112 commits across 4 repositories, 3 new smart contracts on Base Mainnet, and a significantly enhanced user experience, Wave 3 establishes SideShift Pulse as a production-ready platform for community-driven decision making and engagement.

---

## Links

- **GitHub:** https://github.com/sideshiftai
- **Main App:** https://pulse.sideshift.ai
- **API Docs:** https://api.pulse.sideshift.ai
- **SideShift:** https://sideshift.ai

---

*Built with SideShift's cross-chain technology on Base*
