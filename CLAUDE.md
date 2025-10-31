# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application using the App Router architecture with TypeScript and Tailwind CSS v4. The project uses React 19.2.0 and follows modern Next.js conventions.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server (requires build first)
npm start

# Run linting
npm run lint
```

## Architecture

### Framework: Next.js App Router
- Uses the `app/` directory structure (not `pages/`)
- Server Components by default (add "use client" directive for client components)
- File-based routing where folders define routes and special files define UI

### Key Files
- `app/layout.tsx` - Root layout that wraps all pages, defines HTML structure and global fonts
- `app/page.tsx` - Home page component at `/` route
- `app/globals.css` - Global styles with Tailwind CSS v4 directives and CSS variables
- `next.config.ts` - Next.js configuration (TypeScript format)
- `tsconfig.json` - TypeScript configuration with path alias `@/*` mapping to project root

### Styling
- **Tailwind CSS v4** via PostCSS plugin (`@tailwindcss/postcss`)
- CSS variables defined in `globals.css` for theming (`--background`, `--foreground`)
- Dark mode support using `prefers-color-scheme` media query
- Custom fonts: Geist Sans and Geist Mono loaded via `next/font/google`

### TypeScript Configuration
- Strict mode enabled
- Path alias: `@/*` maps to project root for imports
- JSX mode: `react-jsx` (no React import needed in component files)
- Module resolution: `bundler` (modern Next.js approach)

### Linting
- ESLint with Next.js configurations (`eslint-config-next`)
- Uses flat config format in `eslint.config.mjs`
- TypeScript-aware linting enabled

## Authentication with Clerk

This application uses [Clerk](https://clerk.com/) for authentication and user management.

### Setup
- Package: `@clerk/nextjs`
- Middleware: `middleware.ts` uses `clerkMiddleware()` from `@clerk/nextjs/server`
- Provider: App wrapped with `<ClerkProvider>` in `app/layout.tsx`
- Environment variables in `.env.local`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Get from [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys)
  - `CLERK_SECRET_KEY` - Get from [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys)

### Available Components
Import from `@clerk/nextjs`:
- `<SignInButton>` - Triggers sign in flow
- `<SignUpButton>` - Triggers sign up flow
- `<UserButton>` - User profile/settings dropdown
- `<SignedIn>` - Renders children only when user is authenticated
- `<SignedOut>` - Renders children only when user is not authenticated

### Server-Side Authentication
For server components and API routes, use `auth()` from `@clerk/nextjs/server`:

```tsx
import { auth } from "@clerk/nextjs/server";

export default async function ServerComponent() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Not authenticated</div>;
  }

  // Fetch user-specific data
  return <div>Welcome, user {userId}</div>;
}
```

### Protecting Routes
Use `clerkMiddleware()` with route protection in `middleware.ts`. By default, all routes are public. To protect specific routes, modify the middleware configuration.

### Styling Customization
Clerk components are styled to match the application theme:
- **Variables**: Colors, fonts, and border radius configured in `<ClerkProvider appearance={{...}}>` in `app/layout.tsx`
- **Custom fonts**: Uses Geist Sans font family via CSS variables
- **Color scheme**: Matches zinc color palette from Tailwind
- **Dark mode**: CSS overrides in `app/globals.css` ensure proper dark mode appearance
- **Tailwind classes**: Element-level customization using Tailwind utility classes

To modify Clerk styling:
1. Update the `appearance` prop in `<ClerkProvider>` in `app/layout.tsx`
2. Adjust CSS overrides in `app/globals.css` under `/* Clerk Customization */`
3. For component-specific styling, pass `appearance` prop to individual components

### Important Notes
- **NEVER use `authMiddleware()`** - it's deprecated. Always use `clerkMiddleware()` from `@clerk/nextjs/server`
- This is an **App Router** setup - not compatible with Pages Router (`pages/` directory)
- All auth checks in server components must use `async/await` with `auth()`

## Routing in App Router

Create new routes by adding folders with `page.tsx` files:
- `app/about/page.tsx` → `/about` route
- `app/blog/[slug]/page.tsx` → `/blog/:slug` dynamic route
- `app/api/hello/route.ts` → `/api/hello` API endpoint

Special files:
- `layout.tsx` - Shared UI that wraps child segments
- `page.tsx` - Route's unique UI
- `loading.tsx` - Loading UI for Suspense boundaries
- `error.tsx` - Error UI boundary
- `route.ts` - API route handler

## Component Patterns

All components are Server Components by default. For client-side interactivity:

```tsx
"use client"

export default function ClientComponent() {
  // Can use hooks, event handlers, browser APIs
}
```

Server Components can directly fetch data and don't send JavaScript to the client.

## Static Assets

Place images and other static files in the `public/` directory. Reference them with paths starting from `/`:

```tsx
<Image src="/next.svg" alt="..." width={100} height={20} />
```
