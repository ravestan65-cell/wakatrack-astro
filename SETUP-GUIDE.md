# WakaTrack Astro - Setup Guide

## What Was Done

### 1. Project Structure Created
```
wakatrack-astro/
├── src/
│   ├── components/          # All React components (copied from Next.js)
│   │   ├── ui/              # UI components (button, card, etc.)
│   │   ├── address-card.tsx
│   │   ├── description-card.tsx
│   │   ├── map-card.tsx
│   │   ├── package-details-card.tsx
│   │   ├── shipments-table.tsx
│   │   ├── shipping-details-card.tsx
│   │   ├── tracking-history.tsx
│   │   ├── tracking-table.tsx
│   │   ├── TrackingForm.tsx      # Home page form
│   │   └── TrackingPageClient.tsx # Tracking details page
│   ├── layouts/
│   │   └── Layout.astro     # Base layout with Tailwind
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client & types
│   │   ├── auth.ts          # Authentication helpers
│   │   └── utils.ts         # Utility functions (cn, formatPrice)
│   ├── pages/
│   │   ├── index.astro      # Home page (tracking form)
│   │   ├── tracking/
│   │   │   └── [id].astro   # Tracking details page
│   │   └── api/
│   │       ├── track.ts     # POST - lookup by tracking number
│   │       ├── tracking/
│   │       │   └── [id].ts  # GET - shipment details (public)
│   │       ├── auth/
│   │       │   ├── login.ts    # POST - user login
│   │       │   ├── register.ts # POST - user registration
│   │       │   ├── logout.ts   # POST - user logout
│   │       │   └── session.ts  # GET - check session
│   │       └── admin/
│   │           └── shipments/
│   │               ├── index.ts  # GET all, POST create
│   │               └── [id].ts   # GET, PUT, DELETE single
│   └── styles/
│       └── global.css       # Tailwind CSS
├── supabase-schema.sql      # Database schema to run in Supabase
├── .env.example             # Environment variables template
├── astro.config.mjs         # Astro config with React, Tailwind, Cloudflare
└── package.json
```

### 2. Tech Stack
- **Framework**: Astro 5.x with React integration
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Custom session-based auth with Supabase
- **Deployment**: Cloudflare Pages adapter installed

### 3. API Endpoints Created

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/track` | POST | No | Find shipment by tracking number |
| `/api/tracking/[id]` | GET | No | Get shipment details (public) |
| `/api/auth/login` | POST | No | User login |
| `/api/auth/register` | POST | No | User registration |
| `/api/auth/logout` | POST | No | User logout |
| `/api/auth/session` | GET | No | Check current session |
| `/api/admin/shipments` | GET | Admin | List all shipments |
| `/api/admin/shipments` | POST | Admin | Create new shipment |
| `/api/admin/shipments/[id]` | GET | Admin | Get single shipment |
| `/api/admin/shipments/[id]` | PUT | Admin | Update shipment |
| `/api/admin/shipments/[id]` | DELETE | Admin | Delete shipment |

---

## What You Need To Do

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose a name (e.g., "wakatrack")
5. Set a strong database password (save it!)
6. Select a region close to your users
7. Click "Create new project"
8. Wait for project to be ready (~2 minutes)

### Step 2: Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the ENTIRE contents of `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" (or Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is correct!

### Step 3: Get Your API Keys

1. In Supabase, go to **Settings** (gear icon) → **API**
2. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (long string)
3. Copy both of these

### Step 4: Create .env File

In the `wakatrack-astro` folder:

```bash
# Create .env file
cp .env.example .env
```

Then edit `.env` with your values:

```env
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Create Admin User

In Supabase SQL Editor, run this to create an admin user:

```sql
-- Create admin user (change email and password!)
INSERT INTO users (email, password, name, is_admin)
VALUES (
  'admin@example.com',
  '$2a$10$YourHashedPasswordHere',  -- See note below
  'Admin User',
  true
);
```

**To hash a password**, you can:
1. Use an online bcrypt generator: https://bcrypt-generator.com/
2. Enter your password, use 10 rounds
3. Copy the hash and use it above

Or run this in your terminal (after npm install):
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password-here', 10).then(console.log)"
```

### Step 6: Create Test Shipment

In Supabase SQL Editor:

```sql
-- Create a test shipment
INSERT INTO shipments (
  tracking_number,
  customer_name,
  origin,
  destination,
  shipment_status,
  status_details,
  current_location
) VALUES (
  'TEST123456',
  'John Doe',
  'New York, USA',
  'Los Angeles, USA',
  'In Transit',
  'Package is on the way',
  'Chicago, USA'
);

-- Add a tracking event
INSERT INTO tracking_events (
  shipment_id,
  status,
  description,
  location
) VALUES (
  (SELECT id FROM shipments WHERE tracking_number = 'TEST123456'),
  'Shipped',
  'Package has been shipped',
  'New York, USA'
);
```

### Step 7: Test Locally

```bash
cd /Users/bob/Downloads/wakatrack-astro
npm run dev
```

Then:
1. Open http://localhost:4321
2. Enter "TEST123456" in the tracking form
3. You should see the tracking page!

### Step 8: Deploy to Cloudflare Pages

```bash
# Build the project
npm run build

# Deploy (first time - will prompt for Cloudflare login)
npx wrangler pages deploy dist

# Or connect to GitHub for automatic deployments
```

In Cloudflare Pages dashboard, add environment variables:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

---

## Still Needed (Optional)

These pages were not fully converted yet:
- [ ] Login page UI (`/login`)
- [ ] Register page UI (`/register`)
- [ ] Admin dashboard (`/admin`)
- [ ] Admin shipment list (`/admin/shipments`)
- [ ] Admin shipment edit (`/admin/shipments/[id]/edit`)
- [ ] User dashboard (`/dashboard`)
- [ ] User shipment list

The API endpoints for these already exist - just need the UI pages.

---

## Differences from Next.js Version

| Feature | Next.js | Astro |
|---------|---------|-------|
| Database | Prisma + SQLite | Supabase (PostgreSQL) |
| Auth | NextAuth | Custom session cookies |
| Routing | App Router | File-based pages |
| API Routes | Route handlers | Astro endpoints |
| Deployment | Vercel | Cloudflare Pages |

---

## Troubleshooting

### "Supabase client not initialized"
- Check your `.env` file has the correct values
- Make sure the variable names start with `PUBLIC_`

### "Shipment not found"
- Run the test shipment SQL above
- Check the tracking number is exact (case-sensitive)

### "Unauthorized" on admin routes
- You need to log in first
- Make sure you created an admin user with `is_admin = true`

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that all imports use relative paths (`../lib/supabase` not `@/lib/supabase`)
