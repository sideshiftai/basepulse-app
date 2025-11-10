# User Preferences Feature

Complete user preference system for managing reward claims and token preferences.

## Overview

The preferences feature allows users to:
- Select their preferred cryptocurrency for reward claims
- Enable/disable automatic reward claiming
- Save preferences to their wallet address
- View and update settings at any time

## Architecture

### Backend API

**Endpoints:**
- `GET /api/preferences/:address` - Get user preferences
- `PUT /api/preferences/:address` - Update all preferences
- `PATCH /api/preferences/:address/token` - Update preferred token only
- `PATCH /api/preferences/:address/auto-claim` - Update auto-claim only
- `DELETE /api/preferences/:address` - Delete preferences

**Database Schema:**
```sql
CREATE TABLE "UserPreference" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  preferredToken TEXT,
  autoClaimEnabled BOOLEAN DEFAULT false NOT NULL,
  createdAt TIMESTAMP DEFAULT now() NOT NULL,
  updatedAt TIMESTAMP DEFAULT now() NOT NULL
);
```

### Frontend Components

**1. API Client** (`lib/api/preferences-client.ts`)
- Type-safe API functions
- Centralized error handling
- Support for all CRUD operations

**2. React Hooks** (`hooks/use-preferences.ts`)
- `useUserPreferences(address)` - Fetch preferences with React Query
- `useUpdatePreferences()` - Update full preferences
- `useUpdatePreferredToken()` - Update token only
- `useUpdateAutoClaim()` - Update auto-claim only
- Optimistic updates for instant UI feedback
- Automatic cache invalidation

**3. Token Selector** (`components/preferences/token-selector.tsx`)
- Dropdown with search functionality
- Popular tokens shown first (ETH, USDC, USDT, DAI, WBTC)
- Fetches supported assets from SideShift API
- Keyboard navigation support
- Visual token names and symbols

**4. Auto-Claim Toggle** (`components/preferences/auto-claim-toggle.tsx`)
- Toggle switch component
- Information tooltip explaining functionality
- Warning about gas fees
- Visual feedback for enabled/disabled state

**5. Settings Page** (`app/settings/page.tsx`)
- Full preferences management interface
- Wallet connection check
- Loading and error states
- Success notifications
- Unsaved changes detection
- Account information display

## User Flow

### First Time Setup

1. User connects wallet
2. Navigates to Settings page
3. Selects preferred token from dropdown
4. Optionally enables auto-claim
5. Clicks "Save Changes"
6. Preferences stored in database

### Updating Preferences

1. User navigates to Settings
2. Preferences automatically load
3. Makes changes to token or auto-claim
4. "Save Changes" button becomes enabled
5. Clicks save
6. Optimistic update shows immediately
7. Success message displays
8. Changes persisted to database

### Claiming Rewards

When a user claims rewards:

1. **Without Preferences:**
   - Rewards claimed in native token (ETH)
   - Manual claim process

2. **With Preferred Token:**
   - Rewards automatically converted to preferred token via SideShift
   - Conversion happens during claim

3. **With Auto-Claim Enabled:**
   - System automatically initiates claim when poll ends
   - Converts to preferred token if set
   - Sends directly to user's wallet
   - Gas fees deducted from rewards

## Integration Points

### Navigation
Settings link added to main navigation for connected users:
- Desktop menu
- Mobile hamburger menu
- Only visible when wallet is connected

### Reward Claiming Flow
Future integration points:
- `claim-rewards-dialog.tsx` - Check preferred token
- Distribution worker - Use auto-claim setting
- SideShift integration - Use preferred token for conversion

### Analytics
Preferences can be tracked for:
- Most popular tokens
- Auto-claim adoption rate
- User engagement metrics

## Technical Details

### State Management

**React Query:**
- 5-minute stale time for preferences
- Automatic background refetching
- Optimistic updates for instant feedback
- Cache invalidation on mutations

**Optimistic Updates:**
```typescript
onMutate: async (newData) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['preferences', address] });

  // Save previous value
  const previousPreferences = queryClient.getQueryData(['preferences', address]);

  // Optimistically update
  queryClient.setQueryData(['preferences', address], (old) => ({
    ...old,
    ...newData
  }));

  return { previousPreferences };
}
```

### Error Handling

**API Level:**
- Axios interceptors for global error handling
- Proper HTTP status codes
- Detailed error messages

**Component Level:**
- Loading states with spinners
- Error alerts with retry options
- Success notifications
- Validation before submission

**Hook Level:**
- Automatic rollback on mutation error
- Previous state restoration
- Error context provided to components

### Validation

**Frontend:**
- Required wallet connection
- Token must be from supported list
- Boolean validation for auto-claim

**Backend:**
- Zod schema validation
- Address format validation
- Token whitelist checking

## Supported Tokens

Tokens fetched from SideShift API. Popular tokens include:

- **ETH** - Ethereum
- **USDC** - USD Coin
- **USDT** - Tether USD
- **DAI** - Dai Stablecoin
- **WBTC** - Wrapped Bitcoin
- **Plus 100+ other cryptocurrencies**

## Auto-Claim Feature

### How It Works

1. **Poll Ends:**
   - Event listener detects poll ended
   - Checks if winner has auto-claim enabled

2. **Automatic Processing:**
   - Distribution worker queues claim job
   - Fetches user's preferred token
   - Initiates SideShift conversion if needed
   - Executes on-chain claim transaction

3. **Notification:**
   - User receives tokens in wallet
   - Gas fees deducted from rewards
   - Transaction hash recorded

### Benefits

- **Convenience:** No manual claiming needed
- **Efficiency:** Batch processing reduces gas costs
- **Flexibility:** Convert to any supported token
- **Transparency:** All transactions on-chain

### Considerations

- **Gas Fees:** Deducted from rewards
- **Conversion Rates:** SideShift market rates apply
- **Processing Time:** May take a few minutes
- **Minimum Amount:** Small rewards may not cover gas

## Security

### Wallet Authentication

- Settings page requires wallet connection
- Address verification for all operations
- No ability to update other users' preferences

### API Security

- CORS configured for frontend origin only
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS protection via sanitization

### Privacy

- Preferences stored per wallet address
- No PII collected
- Optional feature (can be disabled)
- User can delete preferences anytime

## Future Enhancements

1. **Email Notifications:**
   - Optional email when auto-claim executes
   - Digest of weekly rewards

2. **Multiple Token Preferences:**
   - Different tokens for different poll types
   - Percentage-based split (50% ETH, 50% USDC)

3. **Advanced Claiming:**
   - Schedule claiming for specific times
   - Minimum threshold before auto-claim
   - Slippage tolerance settings

4. **Social Features:**
   - Share preferences with friends
   - Popular token statistics
   - Recommended tokens based on activity

5. **Mobile App:**
   - Push notifications for auto-claims
   - Quick toggle for auto-claim
   - In-app token selector

## Testing

### Manual Testing Checklist

- [ ] Connect wallet
- [ ] Navigate to settings page
- [ ] Select preferred token
- [ ] Toggle auto-claim on/off
- [ ] Save changes
- [ ] Verify success message
- [ ] Refresh page - preferences persist
- [ ] Disconnect wallet - redirected
- [ ] Change token - save again
- [ ] Delete preferences
- [ ] Mobile responsive design
- [ ] Dark/light theme compatibility

### Integration Testing

- [ ] Preferences API responds correctly
- [ ] Optimistic updates work
- [ ] Error rollback functions
- [ ] Cache invalidation happens
- [ ] Navigation link appears when connected
- [ ] Settings link hidden when disconnected

## Deployment

### Environment Variables

Backend:
```env
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://basepulse.io
```

Frontend:
```env
NEXT_PUBLIC_API_URL=https://api.basepulse.io
```

### Database Migration

Run Drizzle migration:
```bash
cd basepulse-api
npm run db:push
```

### Frontend Build

```bash
cd basepulse-app
npm run build
npm run start
```

## Support

For issues or questions:
- Check API documentation: `API_DOCUMENTATION.md`
- Review event listener: `EVENT_LISTENER.md`
- Check SideShift integration: `SIDESHIFTAI.md`
