# Rider Management Frontend

Next.js frontend for public rider registration and admin rider management.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Leaflet & React-Leaflet (dynamic client-side hydration)
- React Hook Form
- Zod
- TanStack Query
- Axios
- Tailwind CSS
- Lucide icons
- Sonner toasts
- Canvas-confetti

## Setup

Install dependencies:

```powershell
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env.local
```

Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WHATSAPP_GROUP_URL=https://chat.whatsapp.com/your-invite-code
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/rebelsonroads?igsh=anMyNTkwYzNwYjY0
```

Start development server:

```powershell
npm run dev
```

Default frontend URL:

```text
http://localhost:3000
```

If port `3000` is busy, Next.js may use `3001`.

## Scripts

```powershell
npm run dev     # Start local Next.js dev server
npm run build   # Create production build
npm run start   # Run production build
npm run lint    # Run ESLint non-interactively
npm test        # Run Vitest tests
```

## Pages

```text
/                                # Homepage with hero, media carousel, and club stories
/about                           # Club legacy, leadership, and code of conduct
/contact                         # Partnership enquiry submission
/join-group                      # Public rider registration form
/live-ride/[id]                  # Mobile Rider Cockpit HUD, GPS telemetry & pillion pairing
/calendar                        # Road calendar combining events, rides, and missions
/calendar/[id]                   # Event & ride briefing details
/admin/login                     # Admin sign-in & forgot password request
/admin/reset-password            # Crypto token-verified password reset interface
/admin/dashboard                 # Command-center metrics and site configuration
/admin/riders                    # Searchable roster, document verification & export
/admin/riders/[id]               # Full rider dossier, document preview & review
/admin/live-rides                # Formation planner, QR code generator & ride status
/admin/live-rides/[id]           # Real-time Leaflet tactical radar, squad roster & broadcasts
/admin/content                   # CMS for club events, stories, and routes
/admin/partner-enquiries         # Brand partner enquiry manager
/admin/email-center              # Brevo-backed transactional and blast email dispatch
```

## Main Features

- **Tactical Convoy Radar**:
  - Interactive Leaflet dark-canvas GIS map at `/admin/live-rides/[id]` using dynamically loaded client-only tiles (`next/dynamic` with `ssr: false`).
  - Dynamic `fitBounds` auto-centering around the active fleet formation.
  - Role-coded chromatic markers (Lead/Gold, Marshal/Cyan, Sweeper/Purple, Pillion/Orange, Rider/Red).
  - Dynamic rotating SVG heading pointers aligned with real compass bearings (0–359°).
  - Signal loss detection (>45s) and speed telemetry readouts in km/h.
  - Interactive participant dossiers with 1-tap dialer and role promotion/ejection actions.
  - Squad-wide alert broadcasts and targeted participant whispers.
- **Rider Cockpit HUD (`/live-ride/[code]`)**:
  - High-precision GPS telemetry uplink (`navigator.geolocation.watchPosition`).
  - Screen Wake-Lock API integration to keep the rider's phone active during convoy navigation.
  - Real-time formation status alerts with synthesized Web Audio chimes and Web Notifications.
  - Convoy formation validation with pillion passenger pairing and vehicle capacity limits (max 1 rider + 1 pillion).
- **Admin Password Reset & Security**:
  - Self-service "Forgot Password" modal on `/admin/login` initiating email reset links via Brevo.
  - Secure `/admin/reset-password` screen validating 32-byte crypto tokens.
  - In-portal password update modal on the admin dashboard.
  - Strict password history check preventing reuse of the last 5 passwords.
- **Public Rider Registration**:
  - Multi-step registration form with client-side Zod validation.
  - Minimum age 18 verification and Aadhaar 12-digit validation.
  - Drag-and-drop document upload for Aadhaar and optional Driving License.
- **Administrative Operations**:
  - Secure HttpOnly session cookie authentication.
  - Search, filter, and sortable member roster with Aadhaar masking.
  - Instant CSV and Excel export generation.
  - Partner enquiry review and reply interface.
  - Brevo email center with delivery tracking.

## Backend Requirement

The backend API must be running before registration, admin login, rider management, and logo upload will work.

Expected local backend URL:

```text
http://localhost:8000/api
```

## Build

```powershell
npm run build
```
