# Announcements System

Complete announcement management system for BasePulse, allowing admins to create and manage platform-wide announcements.

## Overview

The announcements system allows designated admin wallet addresses to create, edit, publish, archive, and delete announcements that appear on the landing page. It includes:

- **Public banner component** - Displays active announcements on the landing page
- **Admin management interface** - Full CRUD operations for announcements
- **Status workflow** - Draft → Published → Archived
- **Scheduling** - Optional start and end dates
- **Priority system** - Control which announcement is shown when multiple are active
- **Dismissible banners** - Users can dismiss announcements (tracked via localStorage)

## Architecture

### Backend (../basepulse-api)

**Database Schema** (`src/db/schema/announcements.ts`):
```typescript
{
  id: uuid (primary key)
  title: string
  description: string
  link?: string
  linkText?: string (default: "Learn More")
  status: 'draft' | 'published' | 'archived' (default: 'draft')
  startDate?: timestamp
  endDate?: timestamp
  dismissible: boolean (default: true)
  priority: number (1-10, default: 1)
  createdBy: string (wallet address)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Service** (`src/services/announcements.service.ts`):
- `getPublished()` - Returns active published announcements within date range
- `getActive()` - Returns highest priority published announcement
- `getAll()` - Returns all announcements (admin only)
- `getById(id)` - Get single announcement
- `create(data)` - Create new announcement
- `update(id, data)` - Update announcement
- `delete(id)` - Delete announcement
- `publish(id)` - Set status to published
- `archive(id)` - Set status to archived

**API Endpoints** (`src/routes/announcements.routes.ts`):

Public endpoints:
- `GET /api/announcements` - List all published announcements
- `GET /api/announcements/active` - Get active announcement
- `GET /api/announcements/:id` - Get announcement by ID

Admin endpoints (require adminAddress query param):
- `GET /api/announcements/all?adminAddress=0x...` - List all announcements
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id?adminAddress=0x...` - Update announcement
- `DELETE /api/announcements/:id?adminAddress=0x...` - Delete announcement
- `POST /api/announcements/:id/publish?adminAddress=0x...` - Publish announcement
- `POST /api/announcements/:id/archive?adminAddress=0x...` - Archive announcement

**Admin Verification**:
Admin access is controlled via the `ADMIN_ADDRESSES` environment variable:
```
ADMIN_ADDRESSES=0x123...,0x456...,0x789...
```

### Frontend

**API Client** (`lib/api/announcements-client.ts`):
- Type-safe API client using axios
- Full CRUD operations
- TypeScript interfaces for Announcement, CreateAnnouncementData, UpdateAnnouncementData

**React Hooks** (`hooks/use-announcements.ts`):
- `usePublishedAnnouncements()` - Fetch published announcements
- `useActiveAnnouncement()` - Fetch active announcement (5 min stale time)
- `useAllAnnouncements(adminAddress)` - Fetch all (admin only)
- `useCreateAnnouncement()` - Create mutation
- `useUpdateAnnouncement()` - Update mutation
- `useDeleteAnnouncement()` - Delete mutation
- `usePublishAnnouncement()` - Publish mutation
- `useArchiveAnnouncement()` - Archive mutation

**Components**:

1. **AnnouncementBanner** (`components/announcement-banner.tsx`)
   - Dismissible banner shown at top of landing page
   - Gradient background (blue/purple/indigo)
   - Megaphone icon
   - External link button
   - Responsive design
   - localStorage tracking for dismissal per announcement ID

2. **Admin Page** (`app/admin/announcements/page.tsx`)
   - Table view of all announcements
   - Create/Edit dialogs with full form
   - Status badges (draft/published/archived)
   - Quick actions: Edit, Publish, Archive, Delete
   - Delete confirmation dialog
   - Admin access check

**Navigation** (`components/navigation.tsx`):
- Added "Announcements" link for admin users
- Checks `NEXT_PUBLIC_ADMIN_ADDRESSES` environment variable

## Setup

### Backend Environment Variables

Add to `../basepulse-api/.env`:
```env
ADMIN_ADDRESSES=0x1234567890abcdef1234567890abcdef12345678,0xabcdef1234567890abcdef1234567890abcdef12
```

### Frontend Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_ADMIN_ADDRESSES=0x1234567890abcdef1234567890abcdef12345678,0xabcdef1234567890abcdef1234567890abcdef12
```

### Database Migration

The database schema has already been pushed. If you need to re-run:

```bash
cd ../basepulse-api
npm run db:push
```

## Usage

### Creating an Announcement (Admin)

1. Connect wallet with an admin address
2. Navigate to "Announcements" in the navigation
3. Click "New Announcement"
4. Fill in the form:
   - **Title** (required) - Short announcement title
   - **Description** (required) - Longer description
   - **Link** (optional) - External URL
   - **Link Text** - Text for link button (default: "Learn More")
   - **Start Date** (optional) - When to start showing
   - **End Date** (optional) - When to stop showing
   - **Priority** (1-10) - Higher priority shown first
   - **Dismissible** - Allow users to dismiss
5. Click "Create Draft" - Announcement saved as draft
6. Click publish icon to make it live

### Publishing Workflow

1. Create announcement → Saved as **Draft**
2. Review and edit as needed
3. Click publish icon → Status changes to **Published**
4. Announcement appears on landing page (if within date range)
5. Click archive icon → Status changes to **Archived**

### Active Announcement Logic

The "active" announcement shown on the landing page is determined by:
1. Status must be "published"
2. Current date must be within startDate/endDate (if specified)
3. Highest priority wins (if multiple match)

### User Dismissal

When a user dismisses an announcement:
- Stored in localStorage: `announcement-dismissed-{id} = true`
- Banner won't show again for that specific announcement
- New announcements will show normally

## Example: Base IDO Platform Announcement

To create the Base IDO announcement:

1. Go to `/admin/announcements`
2. Create new announcement:
   - **Title**: "Introducing Base IDO - Launch Your Token on Base"
   - **Description**: "A complete IDO platform for launching tokens on Base. Handle everything from token creation to sales, distribution, vesting, and more."
   - **Link**: https://baseido.vercel.app/
   - **Link Text**: "Visit Base IDO"
   - **Priority**: 10 (highest)
   - **Dismissible**: Yes
3. Publish the announcement
4. It will appear at the top of the landing page

## Files Created/Modified

### Backend
- `../basepulse-api/src/db/schema/announcements.ts` - Database schema
- `../basepulse-api/src/services/announcements.service.ts` - Business logic
- `../basepulse-api/src/routes/announcements.routes.ts` - API routes
- `../basepulse-api/src/db/schema/index.ts` - Export announcements schema
- `../basepulse-api/src/index.ts` - Register announcements routes

### Frontend
- `./lib/api/announcements-client.ts` - API client
- `./hooks/use-announcements.ts` - React Query hooks
- `./components/announcement-banner.tsx` - Banner component
- `./app/admin/announcements/page.tsx` - Admin management page
- `./app/page.tsx` - Added banner to landing page
- `./components/navigation.tsx` - Added announcements link

## Security Considerations

1. **Admin Authentication**: Currently uses wallet address matching. For production, consider:
   - Message signing for authentication
   - Session management
   - Rate limiting

2. **Input Validation**: Zod schemas validate all inputs on backend

3. **XSS Prevention**: All user inputs are sanitized by React

4. **CORS**: API configured with appropriate CORS settings

## Future Enhancements

- [ ] Rich text editor for descriptions
- [ ] Image upload for announcements
- [ ] Multiple announcement types (info, warning, success)
- [ ] Scheduled publishing
- [ ] Analytics (views, clicks, dismissals)
- [ ] A/B testing for announcements
- [ ] Message signing for admin authentication
- [ ] Announcement templates
