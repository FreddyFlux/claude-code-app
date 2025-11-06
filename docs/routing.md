# Routing Coding Standards

This document outlines the strict routing and route protection coding standards for this Next.js project. All developers must adhere to these guidelines.

## Application Routing Architecture

### Route Structure Convention

**CRITICAL RULE: All authenticated application routes MUST be under the `/dashboard` path.**

```
app/
├── page.tsx                           # Public landing page (/)
├── layout.tsx                         # Root layout
└── dashboard/                         # Protected application area
    ├── page.tsx                       # Dashboard home (/dashboard)
    ├── workout/
    │   ├── new/
    │   │   └── page.tsx              # Create workout (/dashboard/workout/new)
    │   └── [workoutId]/
    │       └── page.tsx              # Edit workout (/dashboard/workout/[id])
    └── [other-features]/             # All other features under /dashboard
```

### Routing Principles

- ✅ **DO**: Place all authenticated features under `/dashboard`
- ✅ **DO**: Keep the root `/` page as a public landing/marketing page
- ✅ **DO**: Use nested routes under `/dashboard` for feature organization
- ❌ **DO NOT**: Create authenticated routes outside of `/dashboard`
- ❌ **DO NOT**: Mix public and protected routes in the same directory

## Route Protection

### CRITICAL: Middleware-Based Protection

**All `/dashboard` routes MUST be protected via Next.js middleware.**

Route protection should be implemented at the middleware level to ensure consistent authentication across all dashboard routes. This is the MANDATORY approach for this project.

### Middleware Configuration

**File: `middleware.ts`**

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected route patterns
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",  // Protects /dashboard and all sub-routes
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Redirect unauthenticated users to landing page
  if (isProtectedRoute(req) && !userId) {
    const landingUrl = new URL("/", req.url);
    return NextResponse.redirect(landingUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

### Key Middleware Concepts

**1. Route Matchers**

Use `createRouteMatcher()` to define which routes require authentication:

```typescript
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",        // All dashboard routes
  "/admin(.*)",           // All admin routes (if added later)
]);
```

**2. Authentication Check**

Always await `auth()` in Next.js 15+:

```typescript
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();  // MUST await

  if (isProtectedRoute(req) && !userId) {
    // Handle unauthenticated access
  }
});
```

**3. Redirect Logic**

Redirect unauthenticated users to the appropriate landing page:

```typescript
if (isProtectedRoute(req) && !userId) {
  const landingUrl = new URL("/", req.url);
  return NextResponse.redirect(landingUrl);
}
```

- ✅ **DO**: Use `new URL("/", req.url)` for redirects to preserve the origin
- ✅ **DO**: Redirect to `/` (landing page) for unauthenticated dashboard access
- ❌ **DO NOT**: Create separate sign-in pages (Clerk handles authentication UI)
- ❌ **DO NOT**: Use string paths for redirects (use `URL` object)

### Component-Level Auth Checks

While middleware handles route protection, individual page components should still verify authentication for data security:

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  // Belt-and-suspenders approach: verify auth even though middleware protects
  if (!userId) {
    redirect("/");
  }

  // Fetch user-specific data
  const userData = await getUserData(userId);

  return <div>Dashboard content</div>;
}
```

**Why double-check authentication?**
- Defense in depth: Multiple layers of security
- Explicit data protection: Makes it clear this route needs auth
- Developer clarity: Obvious that userId is required for data fetching

- ✅ **DO**: Check auth in pages that fetch user-specific data
- ✅ **DO**: Use `auth()` from `@clerk/nextjs/server` in server components
- ✅ **DO**: Always await `auth()` in Next.js 15+
- ❌ **DO NOT**: Skip middleware protection and only check at component level
- ❌ **DO NOT**: Use client-side auth checks for initial route protection

## Next.js 15+ Routing Patterns

### Modern Async Route Parameters

**CRITICAL: In Next.js 15+, `params` and `searchParams` are Promises and MUST be awaited.**

#### Dynamic Route Parameters

```typescript
// ✅ CORRECT - Next.js 15+
interface PageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function WorkoutEditPage({ params }: PageProps) {
  const { workoutId } = await params;  // Must await

  // Use workoutId to fetch data
  const workout = await getWorkout(workoutId);

  return <div>Edit Workout {workoutId}</div>;
}

// ❌ WRONG - Will throw error in Next.js 15+
interface PageProps {
  params: { workoutId: string };
}

export default async function WorkoutEditPage({ params }: PageProps) {
  const { workoutId } = params;  // ERROR: params is a Promise
}
```

#### Search Parameters

```typescript
// ✅ CORRECT - Next.js 15+
interface PageProps {
  searchParams: Promise<{ date?: string; tz?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;  // Must await
  const date = params.date;

  return <div>Date: {date}</div>;
}

// ❌ WRONG - Will throw error in Next.js 15+
interface PageProps {
  searchParams: { date?: string; tz?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const date = searchParams.date;  // ERROR: searchParams is a Promise
}
```

### Complete Page Example

Here's a complete example following all routing standards:

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkout, updateWorkout } from "@/data/workouts";

interface WorkoutEditPageProps {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ referrer?: string }>;
}

export default async function WorkoutEditPage({
  params,
  searchParams,
}: WorkoutEditPageProps) {
  // 1. Verify authentication (defense in depth)
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // 2. Await route parameters (Next.js 15+ requirement)
  const { workoutId } = await params;
  const search = await searchParams;

  // 3. Fetch user-specific data
  const workout = await getWorkout(workoutId, userId);

  if (!workout) {
    redirect("/dashboard");
  }

  // 4. Render page
  return (
    <div>
      <h1>Edit Workout</h1>
      {/* Form and other UI */}
    </div>
  );
}
```

## Navigation Patterns

### Client-Side Navigation

Use Next.js `Link` component for client-side navigation:

```typescript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/workout/new">New Workout</Link>
    </nav>
  );
}
```

### Programmatic Navigation

Use `useRouter` for dynamic navigation in client components:

```typescript
"use client";

import { useRouter } from "next/navigation";

export default function CreateWorkoutForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    // Create workout...
    const workoutId = await createWorkout(formData);

    // Navigate to edit page
    router.push(`/dashboard/workout/${workoutId}`);
  }

  return <form action={handleSubmit}>...</form>;
}
```

### Server Actions and Redirects

Use `redirect()` from `next/navigation` in Server Actions:

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createWorkout } from "@/data/workouts";

export async function createWorkoutAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const workout = await createWorkout({
    userId,
    name: formData.get("name") as string,
  });

  // Redirect to the newly created workout
  redirect(`/dashboard/workout/${workout.id}`);
}
```

- ✅ **DO**: Use `redirect()` for server-side redirects
- ✅ **DO**: Use `router.push()` for client-side navigation
- ✅ **DO**: Use `Link` component for static navigation links
- ❌ **DO NOT**: Use `window.location` for navigation (breaks Next.js routing)
- ❌ **DO NOT**: Mix client and server navigation patterns

## Route Organization Best Practices

### Feature-Based Organization

Organize routes by feature under `/dashboard`:

```
app/dashboard/
├── page.tsx                    # Dashboard home
├── workout/                    # Workout feature
│   ├── new/
│   │   └── page.tsx
│   └── [workoutId]/
│       └── page.tsx
├── profile/                    # User profile feature
│   └── page.tsx
├── settings/                   # Settings feature
│   └── page.tsx
└── analytics/                  # Analytics feature
    └── page.tsx
```

### Shared Layouts

Use `layout.tsx` files to share UI across route segments:

```typescript
// app/dashboard/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- ✅ **DO**: Create layouts for shared UI (navigation, sidebars)
- ✅ **DO**: Verify auth in layouts to protect all child routes
- ✅ **DO**: Keep layouts focused on structure, not business logic
- ❌ **DO NOT**: Duplicate navigation components across pages

### Loading and Error States

Provide loading and error UIs for better UX:

```typescript
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading dashboard...</p>
    </div>
  );
}

// app/dashboard/error.tsx
"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div>
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
```

## API Routes Under Dashboard Context

While API routes don't have a `/dashboard` path, they still need authentication:

```typescript
// app/api/workouts/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workouts = await getUserWorkouts(userId);

  return NextResponse.json({ workouts });
}
```

- ✅ **DO**: Protect API routes with auth checks
- ✅ **DO**: Return proper HTTP status codes (401 for unauthorized)
- ✅ **DO**: Always await `auth()` in API routes
- ❌ **DO NOT**: Assume API routes are protected by middleware alone

## Common Routing Mistakes

### ❌ WRONG: Forgetting to Await `auth()`

```typescript
// DO NOT DO THIS
export default async function DashboardPage() {
  const { userId } = auth();  // ERROR: Must await in Next.js 15+
}
```

### ✅ CORRECT: Always Await `auth()`

```typescript
export default async function DashboardPage() {
  const { userId } = await auth();
}
```

---

### ❌ WRONG: Not Awaiting Route Parameters

```typescript
// DO NOT DO THIS
interface PageProps {
  params: { workoutId: string };  // ERROR: params is a Promise
}

export default async function Page({ params }: PageProps) {
  const { workoutId } = params;  // ERROR: Must await
}
```

### ✅ CORRECT: Await Route Parameters

```typescript
interface PageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { workoutId } = await params;
}
```

---

### ❌ WRONG: Routes Outside `/dashboard`

```typescript
// DO NOT DO THIS
// app/workouts/page.tsx  ← Wrong location
export default async function WorkoutsPage() {
  // ...
}
```

### ✅ CORRECT: All Features Under `/dashboard`

```typescript
// app/dashboard/workout/page.tsx  ← Correct location
export default async function WorkoutsPage() {
  // ...
}
```

---

### ❌ WRONG: Missing Middleware Protection

```typescript
// middleware.ts
// DO NOT DO THIS - No route protection configured
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();  // Missing protection logic
```

### ✅ CORRECT: Explicit Route Protection

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});
```

---

### ❌ WRONG: Using Deprecated `authMiddleware()`

```typescript
// DO NOT DO THIS
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware();  // Deprecated!
```

### ✅ CORRECT: Use `clerkMiddleware()`

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();
```

## Enforcement

These routing standards are **non-negotiable**. All pull requests must comply with these rules:

1. **All authenticated routes under `/dashboard`** - No exceptions
2. **Middleware-based route protection** - Use `createRouteMatcher()` and `clerkMiddleware()`
3. **Await async route parameters** - `params` and `searchParams` are Promises in Next.js 15+
4. **Always await `auth()`** - Required in Next.js 15+
5. **Double-check auth in components** - Defense in depth for data security
6. **Use proper navigation methods** - `Link`, `router.push()`, or `redirect()`

Any code that violates these standards will be rejected during code review.

## Quick Reference

### Protect Routes in Middleware

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
});
```

### Page with Auth and Params

```typescript
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { id } = await params;
  const { tab } = await searchParams;

  return <div>Content</div>;
}
```

### Server Action with Redirect

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function myAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // Process action...
  redirect("/dashboard");
}
```

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Routing Documentation](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Clerk Route Protection Guide](https://clerk.com/docs/references/nextjs/clerk-middleware)
- See `/docs/auth.md` for detailed Clerk authentication patterns
