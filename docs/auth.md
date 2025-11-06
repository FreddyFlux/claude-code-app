# Authentication Coding Standards

This document outlines the strict authentication coding standards for this Next.js project. All developers must adhere to these guidelines.

## Authentication Provider

### Clerk - MANDATORY

**CRITICAL RULE: ONLY Clerk is permitted for authentication in this project.**

- ✅ **DO**: Use Clerk for all authentication and user management
- ❌ **DO NOT**: Use NextAuth.js, Auth.js, or any other authentication library
- ❌ **DO NOT**: Build custom authentication from scratch
- ❌ **DO NOT**: Use Firebase Auth, Supabase Auth, or other authentication providers

### Why Clerk?

Clerk provides:
- Modern, pre-built UI components for sign-in/sign-up
- Built-in user management dashboard
- Multi-factor authentication (MFA) support
- Social login providers (Google, GitHub, etc.)
- Email/password and magic link authentication
- Session management and security
- Next.js App Router optimization

## Setup and Configuration

### Required Packages

```bash
npm install @clerk/nextjs
```

### Environment Variables

**CRITICAL: These environment variables must be configured in `.env.local`:**

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

- ✅ **DO**: Get keys from [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys)
- ✅ **DO**: Use the `NEXT_PUBLIC_` prefix for the publishable key (client-side access)
- ✅ **DO**: Keep `CLERK_SECRET_KEY` private (server-side only)
- ❌ **DO NOT**: Commit `.env.local` to version control
- ❌ **DO NOT**: Share your secret key

### Application Setup

**1. Root Layout (`app/layout.tsx`)**

The `<ClerkProvider>` must wrap your entire application:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**2. Middleware (`middleware.ts`)**

**CRITICAL: Always use `clerkMiddleware()`, NEVER `authMiddleware()`**

```tsx
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

- ✅ **DO**: Use `clerkMiddleware()` from `@clerk/nextjs/server`
- ❌ **DO NOT**: Use `authMiddleware()` (deprecated)

## Client-Side Authentication

### Available Components

Import from `@clerk/nextjs`:

```tsx
import {
  SignInButton,
  SignUpButton,
  SignOutButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
```

### Component Usage

**`<SignedIn>` and `<SignedOut>`**

Use these components to conditionally render UI based on authentication state:

```tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

**`<UserButton>`**

Pre-built user profile dropdown with account management:

```tsx
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav>
      <UserButton afterSignOutUrl="/" />
    </nav>
  );
}
```

**`<SignInButton>` and `<SignUpButton>`**

Trigger authentication flows:

```tsx
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div>
      <SignInButton mode="modal">
        <button>Sign In</button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button>Sign Up</button>
      </SignUpButton>
    </div>
  );
}
```

### Client Component Hooks

For client components that need user data:

```tsx
"use client";

import { useUser } from "@clerk/nextjs";

export default function ProfileClient() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Not signed in</div>;
  }

  return <div>Welcome, {user.firstName}!</div>;
}
```

- ✅ **DO**: Use `useUser()` hook in client components
- ✅ **DO**: Check `isLoaded` before checking `isSignedIn`
- ✅ **DO**: Add `"use client"` directive at the top of the file
- ❌ **DO NOT**: Use `useUser()` in server components

## Server-Side Authentication

### CRITICAL: Next.js 15+ Async Pattern

**In Next.js 15+, the `auth()` function returns a Promise and MUST be awaited.**

```tsx
import { auth } from "@clerk/nextjs/server";

// ✅ CORRECT - Next.js 15+
export default async function ServerComponent() {
  const { userId } = await auth();  // Must await

  if (!userId) {
    return <div>Not authenticated</div>;
  }

  return <div>User ID: {userId}</div>;
}

// ❌ WRONG - Will throw error in Next.js 15+
export default async function ServerComponent() {
  const { userId } = auth();  // ERROR: must await
}
```

### Accessing User Data

**Get current user ID:**

```tsx
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user-specific data from database
  const userData = await getUserData(userId);

  return <div>Welcome back!</div>;
}
```

**Get full user object:**

```tsx
import { currentUser } from "@clerk/nextjs/server";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

- ✅ **DO**: Use `auth()` for userId only (faster)
- ✅ **DO**: Use `currentUser()` when you need full user object
- ✅ **DO**: Always await both functions
- ❌ **DO NOT**: Forget to await these functions

### API Routes

**Route Handlers (`app/api/*/route.ts`)**

```tsx
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Process authenticated request
  const data = await fetchUserData(userId);

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  // Process authenticated POST request

  return NextResponse.json({ success: true });
}
```

## Route Protection

**IMPORTANT: For comprehensive routing and route protection standards, see `/docs/routing.md`.**

This section provides a quick reference for auth-specific patterns. For full routing conventions, middleware configuration, and Next.js 15+ routing patterns, refer to the routing documentation.

### Method 1: Component-Level Protection

**Server Components:**

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <div>Protected content</div>;
}
```

**Client Components:**

```tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPageClient() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>;
  }

  return <div>Protected content</div>;
}
```

### Method 2: Middleware-Level Protection (RECOMMENDED)

**For this project, all `/dashboard/*` routes MUST be protected via middleware.**

See `/docs/routing.md` for complete middleware configuration and routing standards.

Quick reference:

```tsx
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",  // Protects all dashboard routes
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isProtectedRoute(req) && !userId) {
    const landingUrl = new URL("/", req.url);
    return NextResponse.redirect(landingUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- ✅ **DO**: Use middleware for protecting route groups (required for this project)
- ✅ **DO**: Use component-level checks as defense in depth
- ✅ **DO**: Await `auth()` in middleware callbacks
- ❌ **DO NOT**: Mix authentication libraries
- ❌ **DO NOT**: Skip middleware protection and only use component-level checks

## Common Patterns

### Database User Association

When storing user data in your database, use Clerk's `userId`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function CreateWorkoutPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  async function createWorkout(formData: FormData) {
    "use server";

    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    await db.workout.create({
      data: {
        userId: userId,  // Link to Clerk user
        name: formData.get("name") as string,
        // ... other fields
      },
    });
  }

  return <form action={createWorkout}>...</form>;
}
```

### Conditional Rendering Based on Auth

```tsx
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div>
      <h1>Welcome!</h1>
      {userId ? (
        <a href="/dashboard">Go to Dashboard</a>
      ) : (
        <a href="/sign-in">Sign In to Continue</a>
      )}
    </div>
  );
}
```

## Styling Clerk Components

Clerk components can be customized to match your application's design:

### Theme Configuration

Configure in `app/layout.tsx`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#18181b",
          colorBackground: "#ffffff",
          colorText: "#09090b",
          fontFamily: "var(--font-geist-sans)",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "shadow-lg",
          headerTitle: "text-2xl font-bold",
          formButtonPrimary: "bg-zinc-900 hover:bg-zinc-800",
        },
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Dark Mode Support

Add CSS overrides in `app/globals.css`:

```css
/* Clerk Dark Mode Customization */
@media (prefers-color-scheme: dark) {
  .cl-internal-b3fm6y {
    background-color: #09090b !important;
    color: #fafafa !important;
  }
}
```

## Common Mistakes to Avoid

### ❌ WRONG: Using Deprecated `authMiddleware()`

```tsx
// DO NOT DO THIS
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware();
```

### ✅ CORRECT: Using `clerkMiddleware()`

```tsx
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();
```

---

### ❌ WRONG: Not Awaiting `auth()` in Next.js 15+

```tsx
// DO NOT DO THIS
export default async function Page() {
  const { userId } = auth();  // ERROR: Must await
}
```

### ✅ CORRECT: Awaiting `auth()`

```tsx
export default async function Page() {
  const { userId } = await auth();
}
```

---

### ❌ WRONG: Using `useUser()` in Server Component

```tsx
// DO NOT DO THIS
import { useUser } from "@clerk/nextjs";

export default function ServerPage() {
  const { user } = useUser();  // ERROR: Hooks only work in client components
}
```

### ✅ CORRECT: Using `auth()` in Server Components

```tsx
import { auth } from "@clerk/nextjs/server";

export default async function ServerPage() {
  const { userId } = await auth();
}
```

---

### ❌ WRONG: Missing `isLoaded` Check

```tsx
// DO NOT DO THIS
"use client";
import { useUser } from "@clerk/nextjs";

export default function Profile() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return <div>Not signed in</div>;
  }

  // May cause errors if data not loaded
  return <div>{user.firstName}</div>;
}
```

### ✅ CORRECT: Checking `isLoaded` First

```tsx
"use client";
import { useUser } from "@clerk/nextjs";

export default function Profile() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Not signed in</div>;
  }

  return <div>{user.firstName}</div>;
}
```

## Testing Authentication

### Local Development

1. Sign up for a free Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the API keys to `.env.local`
4. Start your dev server: `npm run dev`
5. Navigate to your app and test sign-in/sign-up flows

### Test Users

Clerk provides test mode in development:
- Create test users in Clerk Dashboard
- Use email/password or social logins
- Test user data appears in Dashboard instantly

## Enforcement

These standards are **non-negotiable**. All pull requests must comply with these rules:

1. **Clerk only** - No other authentication libraries
2. **Always await `auth()`** - Required in Next.js 15+
3. **Use `clerkMiddleware()`** - Never use deprecated `authMiddleware()`
4. **Check `isLoaded`** - Before checking `isSignedIn` in client components
5. **Protect sensitive routes** - Either in middleware or at component level
6. **Never commit `.env.local`** - Keep secrets private

Any code that violates these standards will be rejected during code review.

## Resources

- **Project Documentation**: See `/docs/routing.md` for complete routing and route protection standards
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk App Router Guide](https://clerk.com/docs/references/nextjs/overview)
- [Clerk Components](https://clerk.com/docs/components/overview)
- [Clerk Dashboard](https://dashboard.clerk.com/)
