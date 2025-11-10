# SideShift.ai Integration - Demo Guide

## Overview

The BasePulse app now supports funding polls with **100+ cryptocurrencies** via SideShift.ai integration. Users can fund polls using BTC, LTC, DOGE, USDT, and many more cryptocurrencies, which are automatically converted to ETH.

## ✅ What's Implemented

### Backend (basepulse-api)
- ✅ Database migrations run successfully
- ✅ Shifts table created in PostgreSQL
- ✅ SideShift API service (`/api/sideshift/*`)
- ✅ Webhook handler for status updates
- ✅ Shift tracking and history

### Frontend (basepulse-app)
- ✅ FundPollDialog component integrated into poll cards
- ✅ Currency selector with 100+ cryptocurrencies
- ✅ QR code generation for deposit addresses
- ✅ Real-time status monitoring
- ✅ Toast notifications

## 🚀 How to Start the Demo

### 1. Start the Backend API

```bash
cd /Users/east/workspace/sideshift/basepulse-api
npm run dev
```

The API will run on `http://localhost:3001`

### 2. Start the Frontend

```bash
cd /Users/east/workspace/sideshift/basepulse-app
npm run dev
```

The app will run on `http://localhost:3000`

### 3. Environment Variables

Ensure you have these set in `/Users/east/workspace/sideshift/basepulse-app/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_REOWN_PROJECT_ID=your-project-id-here
```

## 📱 Demo Flow

### Funding a Poll with Cryptocurrency

1. **Navigate to Dapp Page**
   - Go to http://localhost:3000/dapp
   - Connect your wallet
   - View active polls

2. **Click the 💱 Button**
   - On any active poll card, you'll see two funding options:
     - "Fund" button (fund with PULSE/USDC tokens you already have)
     - "💱" button (fund with ANY cryptocurrency via SideShift)

3. **Select Cryptocurrency**
   - Click the 💱 button
   - Dialog opens showing 100+ supported cryptocurrencies
   - Select your preferred crypto (e.g., BTC, LTC, USDT)
   - Enter the amount

4. **Get Deposit Address**
   - Click "Create Shift Order"
   - SideShift generates a unique deposit address
   - QR code is displayed for easy mobile deposits
   - Copy button for desktop wallets

5. **Monitor Status**
   - Status automatically updates every 5 seconds
   - Progress: Waiting → Processing → Settling → Settled
   - Colored badges show current status
   - Auto-stops polling when complete

6. **View History**
   - Check backend logs for shift records
   - Database stores all shift details
   - Webhook updates status in real-time

## 🎯 Supported Cryptocurrencies

100+ assets including:
- **Major Coins**: BTC, ETH, LTC, DOGE, ADA, DOT
- **Stablecoins**: USDT, USDC, DAI, BUSD
- **Memecoins**: SHIB, PEPE, BONK
- **Layer 2s**: MATIC, ARB, OP
- **And many more!**

Full list fetched dynamically from SideShift API.

## 🔧 Technical Details

### Funding Flow

```
User → Select Crypto → Create Shift → Deposit Crypto
  ↓
SideShift converts to ETH
  ↓
ETH sent to user's wallet
  ↓
User manually funds poll contract (or webhook auto-funds if backend wallet configured)
```

### API Endpoints

- `GET /api/sideshift/supported-assets` - List all cryptocurrencies
- `POST /api/sideshift/create-shift` - Create conversion order
- `GET /api/sideshift/shift-status/:id` - Check status
- `POST /api/sideshift/webhook` - Receive SideShift updates
- `GET /api/sideshift/user/:address` - User shift history
- `GET /api/sideshift/poll/:pollId` - Poll shift history

### Components

- `<FundPollDialog />` - Main funding interface
- `<CurrencySelector />` - Dropdown with search
- `<ShiftMonitor />` - Real-time status tracker
- `<ClaimRewardsDialog />` - Reward claiming (for poll detail page)

## 🎨 Demo Tips

### Best Cryptocurrencies for Demo

1. **USDT (TRC-20)** - Fast, cheap, widely available
2. **LTC** - Low fees, fast confirmation
3. **DOGE** - Fun, recognizable, low fees
4. **BTC** - Most recognized, but slower/more expensive

### Testing Scenarios

**Scenario 1: Small Amount**
- Select USDT
- Enter 5 USDT
- Show deposit address and QR
- Demonstrate status monitoring

**Scenario 2: Different Networks**
- Show network selection (e.g., USDT on TRC-20 vs ERC-20)
- Explain fee differences
- Auto-detect best network

**Scenario 3: History**
- Show multiple shifts
- Demonstrate tracking by user/poll
- Show completed vs pending shifts

## 📊 Current Limitations

### Manual Steps Required

1. **After conversion completes**, user must manually:
   - Call `fundPollWithETH()` from their wallet
   - Send the converted ETH to the poll contract

### Future Automation (Optional)

To enable full automation:

1. **Backend Wallet Setup**
   - Add `BACKEND_PRIVATE_KEY` to `.env`
   - Fund backend wallet with ETH for gas
   - Uncomment webhook handler code

2. **Auto-Contract Calls**
   - Backend automatically calls `poll.fundPollWithETH()`
   - User doesn't need to manually fund
   - Fully automated conversion + funding

## 🐛 Troubleshooting

### "No supported assets" error
- Check backend is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check network connection to SideShift API

### Shift creation fails
- Verify poll exists and is active
- Check SideShift API status
- Review backend logs for errors

### Status not updating
- Auto-polling happens every 5 seconds
- Check browser console for errors
- Verify webhook configuration (optional)

### Backend not starting
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Run `npm install` if dependencies missing

## 📝 Notes

### SideShift Configuration

- **Affiliate ID**: `YQMi62XMb` (configured in backend)
- **Webhook Secret**: Generated, stored in `.env`
- **Shift Type**: Variable (market rate, better for small amounts)

### Security

- No API key required (SideShift is public)
- Webhook signature verification enabled
- All database queries use Drizzle ORM (SQL injection safe)
- Input validation with Zod schemas

### Performance

- Supported assets cached (5 min TTL)
- Status polling auto-stops on completion
- Database indexed by user, poll, status

## 🎉 Demo Script

**Introduction:**
"BasePulse now supports funding polls with any cryptocurrency! Users can fund with Bitcoin, Dogecoin, or 100+ other cryptos."

**Step 1: Navigate**
"Let's go to the Dapp page and find an active poll."

**Step 2: Open Dialog**
"Click the currency exchange icon (💱) to fund with cryptocurrency."

**Step 3: Select Crypto**
"I'll select Litecoin for this demo - low fees and fast confirmation."

**Step 4: Create Order**
"Enter amount and click Create Shift. SideShift generates a unique deposit address."

**Step 5: Show QR**
"Here's the QR code. Users can scan with mobile wallet or copy the address."

**Step 6: Monitor**
"The status updates automatically. Once settled, the ETH is sent to user's wallet."

**Closing:**
"This makes it super easy for users worldwide to participate, regardless of which crypto they hold!"

## 📚 Additional Resources

- [SideShift API Docs](https://sideshift.ai/api/)
- [Backend Integration Guide](../basepulse-api/SIDESHIFTAI.md)
- [Frontend Usage Guide](./SIDESHIFT_USAGE.md)
- [Component Documentation](./components/sideshift/README.md)

---

**Created**: 2025-11-10
**Status**: ✅ Ready for Demo
**Integration**: 90% Complete
