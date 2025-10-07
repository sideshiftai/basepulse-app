# Vercel Deployment Troubleshooting Guide

## Issue: No Polls Displaying on Vercel Deployment

### Root Causes Identified

1. **Environment Variables Not Set in Vercel**
   - The contract addresses must be configured in Vercel's environment variables
   - Local `.env.local` is not deployed to Vercel

2. **Contract Only Deployed on Base Sepolia**
   - Your local env shows: `NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA=0xa3713739c39419aA1c6daf349dB4342Be59b9142`
   - Base Mainnet address is still: `0x0000000000000000000000000000000000000000`

3. **Default Network Mismatch**
   - `lib/wagmi.ts` sets `defaultNetwork: base` (mainnet)
   - But your contract is only on Base Sepolia testnet

### Solutions

#### 1. **IMMEDIATE FIX: Hardcoded Fallback (Already Applied)**

I've added a hardcoded fallback address for Base Sepolia in `lib/contracts/contract-config.ts`:
```typescript
const BASE_SEPOLIA_CONTRACT = '0xa3713739c39419aA1c6daf349dB4342Be59b9142'
```

This means the app will work even if environment variables aren't set. **Just redeploy and it should work!**

#### 2. Set Environment Variables in Vercel (Recommended for Production)

For proper production setup, add these environment variables in Vercel:

```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=f9e8d0be09239678eb32ad9dcdcc47aa
NEXT_PUBLIC_POLLS_CONTRACT_BASE_SEPOLIA=0xa3713739c39419aA1c6daf349dB4342Be59b9142
NEXT_PUBLIC_POLLS_CONTRACT_BASE=0x0000000000000000000000000000000000000000
```

**Steps:**
1. Go to https://vercel.com/dashboard
2. Select your project (sspulse)
3. Go to Settings → Environment Variables
4. Add each variable above
5. Redeploy your application

#### 3. Change Default Network to Base Sepolia (Already Applied)

Updated `lib/wagmi.ts` to default to Base Sepolia:

```typescript
defaultNetwork: baseSepolia, // Changed from base
```

This ensures users connect to the testnet where your contract is deployed.

#### 4. Network Switcher Button (Already Applied)

Added a "Switch to Base Sepolia" button that appears when users are on the wrong network. This makes it easy for users to switch to the correct network with one click.

#### 3. Verify Contract Has Polls

Connect to Base Sepolia and check if there are any active polls:

```bash
# Using cast (from Foundry)
cast call 0xa3713739c39419aA1c6daf349dB4342Be59b9142 \
  "getActivePolls()(uint256[])" \
  --rpc-url https://sepolia.base.org
```

If no polls exist, create one through the UI or contract.

### Debugging Steps

The updated code now includes:

1. **Console Logging** - Check browser console for:
   - Chain ID
   - Contract Address
   - Active Poll IDs
   - Any errors

2. **Better Error Messages** - Users will see:
   - Network mismatch warnings
   - Contract deployment status
   - Connection requirements

3. **Network Detection** - Shows which network user is on and if contract exists

### Testing Locally

1. Make sure you're on Base Sepolia network
2. Connect your wallet
3. Check console logs for debugging info
4. Verify contract address is correct

### After Deployment

1. Visit https://sspulse.vercel.app/dapp
2. Open browser console (F12)
3. Look for "=== DAPP PAGE DEBUG ===" logs
4. Verify:
   - Chain ID is 84532 (Base Sepolia)
   - Contract Address is not 0x000...
   - Active Poll IDs array has values
   - No errors in Polls Error log

### Quick Checklist

- [ ] Environment variables set in Vercel
- [ ] Default network changed to baseSepolia
- [ ] Redeployed application
- [ ] At least one poll created on contract
- [ ] Wallet connected to Base Sepolia
- [ ] Browser console shows correct chain ID and contract address

### Common Issues

**"Contract not available on Base Mainnet"**
- Switch to Base Sepolia network in your wallet

**"No active polls found"**
- Create a poll using the "Create Poll" button
- Or verify polls exist on the contract

**Polls still not showing**
- Check browser console for errors
- Verify environment variables in Vercel
- Ensure you've redeployed after setting env vars
