# Rider Management Frontend

Next.js frontend for public rider registration and admin rider management.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- React Hook Form
- Zod
- TanStack Query
- Axios
- Tailwind CSS
- Lucide icons
- Sonner toasts

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
NEXT_PUBLIC_API_URL=http://localhost:5000/api
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
npm run lint    # Run Next lint command
```

## Pages

```text
/join-group
/admin/login
/admin/dashboard
/admin/riders
/admin/riders/[id]
```

## Main Features

- Public rider registration form
- Aadhaar and optional driving license uploads
- Admin login
- Admin dashboard stats
- Rider search, filter, sorting, and pagination
- Rider detail review
- Approve, reject, and delete rider actions
- CSV and Excel export
- Admin logo upload
- Footer social links

## Backend Requirement

The backend API must be running before registration, admin login, rider management, and logo upload will work.

Expected local backend URL:

```text
http://localhost:5000/api
```

## Build

```powershell
npm run build
```
