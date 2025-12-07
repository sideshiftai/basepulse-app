# Wave 3 Summary - SideShift Pulse (Akindo WaveHack)

**Project:** BasePulse / SideShift Pulse
**Wave:** 3
**Period:** November - December 15, 2025
**Repository:** basepulse-app, basepulse-api

---

## Overview

Wave 3 focuses on implementing a comprehensive **Creator Quests System** that enables creators to engage their audience through gamification. Participants earn **POINTS** by completing quests, which are converted to **PULSE tokens** at the end of each season/epoch.

---

## Major Features Implemented

### 1. Creator Quests System

A complete quest management system allowing creators to define quests for their audience.

#### Quest Types
- **Participation Quests**: Tasks participants complete individually (e.g., "Vote on 5 polls")
- **Engagement Goals**: Limited milestone rewards (e.g., "First 100 voters")

#### Quest Requirement Types
- `vote_on_polls` - Vote on X polls by creator
- `vote_on_specific_poll` - Vote on specific poll(s)
- `share_poll` - Share poll on social media
- `first_n_voters` - Be among first N voters
- `participate_n_polls` - Participate in N polls

#### Quest Templates
11 predefined templates for quick quest creation:
- **Engagement**: First Vote, Active Voter, Poll Enthusiast, Super Voter
- **Growth**: Early Bird, First 50 Club, Century Club
- **Loyalty**: Community Builder, Social Champion
- **Special**: Poll Explorer, Dedicated Participant

---

### 2. Seasons/Tournaments System

Creators can organize quests into seasons with PULSE token pools for distribution.

#### Season Features
- Time-bound seasons with start/end dates
- PULSE token pool configuration
- Automatic status management (upcoming → active → ended → distributed)
- Public/Private visibility settings
- Leaderboard for point rankings
- PULSE per point calculation at season end

---

### 3. Tiered Membership System

A 4-tier membership system to prevent abuse and reward engagement.

| Tier | Daily Vote Limit | Max Season Points | Requirements |
|------|------------------|-------------------|--------------|
| **Bronze** | 3 votes/day | 1,000 | Default tier |
| **Silver** | 6 votes/day | 5,000 | 10 polls, 50 votes |
| **Gold** | 9 votes/day | 15,000 | 50 polls, 200 votes, 1 poll created |
| **Platinum** | 12 votes/day | 50,000 | 100 polls, 500 votes, 5 polls created, 1 season |

#### Abuse Prevention Measures
- Daily vote limits enforced per tier
- Season points cap per tier
- Full audit log with reversal capability
- Rate limiting on API endpoints

---

### 4. Points & Rewards System

Off-chain points system that converts to PULSE at season end.

#### Features
- Points awarded for quest completion
- Tier-based max season points cap
- Transaction history with full audit trail
- Reversal capability for abuse handling
- PULSE claiming after season distribution

---

### 5. Context-Aware Navigation

Sidebar navigation that adapts based on current route context.

#### Navigation Contexts
- **Creator Context** (`/creator/*`): Shows creator-specific navigation
- **Participant Context** (`/participant/*`): Shows participant-specific navigation
- **Default Context**: Shows all sections

---

## New Files Created

### Backend (basepulse-api)

#### Database Schemas
```
src/db/schema/membership.ts      # Membership tiers, user membership, daily votes
src/db/schema/seasons.ts         # Seasons/tournaments
src/db/schema/points.ts          # User season points, points transactions
src/db/schema/creator-quests.ts  # Creator quests, quest participations
```

#### Services
```
src/services/membership.service.ts      # Tier management, vote limits
src/services/seasons.service.ts         # Season CRUD, leaderboards
src/services/points.service.ts          # Points awarding, tier caps
src/services/creator-quests.service.ts  # Quest CRUD, progress tracking
```

#### Routes
```
src/routes/membership.routes.ts      # /api/membership/*
src/routes/seasons.routes.ts         # /api/seasons/*
src/routes/points.routes.ts          # /api/points/*
src/routes/creator-quests.routes.ts  # /api/creator-quests/*
```

#### Scripts
```
src/scripts/seed-membership-tiers.ts  # Seed Bronze/Silver/Gold/Platinum tiers
```

### Frontend (basepulse-app)

#### API Clients
```
lib/api/creator-quests-client.ts  # Quest CRUD, progress updates
lib/api/seasons-client.ts         # Season management
lib/api/points-client.ts          # Points balance, history
lib/api/membership-client.ts      # Tier info, vote limits
```

#### Hooks
```
hooks/use-creator-quests.ts  # useCreatorQuests, useCreateQuest, etc.
hooks/use-seasons.ts         # useCreatorSeasons, useSeasonLeaderboard, etc.
hooks/use-points.ts          # useUserSeasonPoints, usePointsHistory, etc.
hooks/use-membership.ts      # useMembershipTiers, useVoteLimitInfo, etc.
```

#### Creator Components
```
components/creator/quests/creator-quests-list.tsx   # Quest table with actions
components/creator/quests/seasons-list.tsx          # Seasons table
components/creator/quests/quest-creation-form.tsx   # Quest form with templates
components/creator/quests/season-creation-form.tsx  # Season form
components/creator/quests/quest-templates.tsx       # 11 predefined templates
```

#### Participant Components
```
components/participant/quests/available-quests-list.tsx  # Available quests
components/participant/quests/points-balance-card.tsx    # Points display
components/participant/quests/membership-tier-card.tsx   # Tier & progress
```

#### Pages
```
app/creator/quests/page.tsx                  # Quest management dashboard
app/creator/quests/create/page.tsx           # Create quest
app/creator/quests/seasons/create/page.tsx   # Create season
app/participant/quests/page.tsx              # Participant quest dashboard
app/participant/points/page.tsx              # Points history
app/participant/membership/page.tsx          # Membership tier details
app/participant/rewards/page.tsx             # PULSE rewards history
```

### Modified Files
```
components/new-sidebar.tsx           # Context-aware navigation
basepulse-api/src/db/schema/index.ts # Export new schemas
basepulse-api/src/index.ts           # Register new routes
```

---

## API Endpoints

### Creator Quests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/creator-quests` | Create quest |
| GET | `/api/creator-quests/creator/:address` | Get creator's quests |
| GET | `/api/creator-quests/:id` | Get quest details |
| PUT | `/api/creator-quests/:id` | Update quest |
| DELETE | `/api/creator-quests/:id` | Delete quest |
| POST | `/api/creator-quests/:id/deactivate` | Deactivate quest |
| GET | `/api/creator-quests/:id/participants` | Get participants |
| POST | `/api/creator-quests/:id/progress` | Update progress |

### Seasons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seasons` | All seasons (with filters) |
| GET | `/api/seasons/active` | Active seasons |
| GET | `/api/seasons/creator/:address` | Creator's seasons |
| GET | `/api/seasons/:id` | Season details |
| POST | `/api/seasons` | Create season |
| PUT | `/api/seasons/:id` | Update season |
| DELETE | `/api/seasons/:id` | Delete season |
| GET | `/api/seasons/:id/leaderboard` | Season leaderboard |
| POST | `/api/seasons/:id/calculate-distribution` | Calculate PULSE distribution |
| POST | `/api/seasons/:id/mark-distributed` | Mark as distributed |

### Points
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/points/:address` | User's total points |
| GET | `/api/points/:address/history` | Points transaction history |
| GET | `/api/points/:address/unclaimed` | Unclaimed PULSE rewards |
| POST | `/api/points/:address/claim` | Mark PULSE as claimed |

### Membership
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/membership/tiers` | All tier definitions |
| GET | `/api/membership/:address` | User's membership & tier |
| POST | `/api/membership/:address/check` | Recalculate tier |
| GET | `/api/membership/:address/daily-votes` | Today's vote count |
| POST | `/api/membership/:address/vote` | Record a vote |

---

## Database Tables

### New Tables
- `MembershipTier` - Tier definitions (Bronze, Silver, Gold, Platinum)
- `UserMembership` - User's current tier and stats
- `DailyVoteCount` - Daily vote tracking per user
- `Season` - Season/tournament definitions
- `CreatorQuest` - Quest definitions
- `CreatorQuestParticipation` - User quest progress
- `UserSeasonPoints` - Points per user per season
- `PointsTransaction` - Points audit log with reversal support

---

## Setup Instructions

### 1. Database Setup
```bash
cd basepulse-api
npm run db:push
```

### 2. Seed Membership Tiers
```bash
npx tsx src/scripts/seed-membership-tiers.ts
```

### 3. Start API Server
```bash
npm run dev
```

### 4. Start Frontend
```bash
cd basepulse-app
npm run dev
```

---

## Screenshots / Demo

*To be added*

---

## Upcoming Work (Before Dec 15)

- [ ] Quest progress auto-tracking (vote events)
- [ ] Season end automation
- [ ] PULSE distribution integration
- [ ] Leaderboard UI
- [ ] Quest detail/edit pages
- [ ] Admin dashboard for abuse review
- [ ] Email/notification system for quest completion

---

## Contributors

- SideShift AI Team

---

## Links

- **Main App:** https://pulse.sideshift.ai
- **API:** https://api.pulse.sideshift.ai
- **GitHub:** https://github.com/sideshiftai/basepulse-app
