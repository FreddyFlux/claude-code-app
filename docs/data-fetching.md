# Data Fetching

## CRITICAL RULES

This document outlines the **mandatory** approach for data fetching in this application. These rules are non-negotiable and must be followed in all circumstances.

## Rule 1: Server Components ONLY

**ALL data fetching MUST be done via Server Components.**

### ✅ CORRECT - Server Component Data Fetching

```tsx
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getUserProjects } from "@/data/projects";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Not authenticated</div>;
  }

  // Fetch data directly in the Server Component
  const projects = await getUserProjects(userId);

  return (
    <div>
      <h1>My Projects</h1>
      <ul>
        {projects.map(project => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### ❌ INCORRECT - Route Handler Data Fetching

```tsx
// DON'T DO THIS - No API route handlers for data fetching
// app/api/projects/route.ts
export async function GET() {
  const projects = await getUserProjects(); // ❌ WRONG APPROACH
  return Response.json(projects);
}
```

### ❌ INCORRECT - Client Component Data Fetching

```tsx
"use client"
import { useEffect, useState } from "react";

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // ❌ WRONG - Don't fetch data in client components
    fetch('/api/projects')
      .then(res => res.json())
      .then(setProjects);
  }, []);

  return <div>{/* ... */}</div>;
}
```

### Why Server Components Only?

1. **Security** - Data fetching logic runs on the server, keeping sensitive operations and credentials secure
2. **Performance** - Reduces JavaScript bundle size sent to the client
3. **Direct Database Access** - No need for API layer overhead
4. **Automatic Request Deduplication** - Next.js optimizes repeated requests
5. **Better Type Safety** - Direct access to typed database results

## Rule 2: Use Data Helper Functions in `/data` Directory

**Database queries MUST ALWAYS be done via helper functions in the `/data` directory.**

### Directory Structure

```
/data
  ├── projects.ts      # Project-related queries
  ├── tasks.ts         # Task-related queries
  ├── users.ts         # User-related queries
  └── ... (other entities)
```

### Creating Data Helper Functions

All helper functions MUST:
1. Accept `userId` as the first parameter
2. Use Drizzle ORM (see Rule 3)
3. Filter results by `userId` to ensure data isolation
4. Include proper TypeScript types

### ✅ CORRECT - Data Helper Function

```tsx
// data/projects.ts
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get all projects for a specific user
 * @param userId - The authenticated user's ID from Clerk
 * @returns Array of projects belonging to the user
 */
export async function getUserProjects(userId: string) {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId));
}

/**
 * Get a single project by ID, ensuring it belongs to the user
 * @param userId - The authenticated user's ID from Clerk
 * @param projectId - The project ID to fetch
 * @returns Project if found and belongs to user, null otherwise
 */
export async function getUserProject(userId: string, projectId: string) {
  const result = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId) // CRITICAL: Always filter by userId
      )
    )
    .limit(1);

  return result[0] || null;
}
```

### Using Data Helper Functions

```tsx
// app/projects/[id]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getUserProject } from "@/data/projects";
import { notFound } from "next/navigation";

export default async function ProjectPage({
  params
}: {
  params: { id: string }
}) {
  const { userId } = await auth();

  if (!userId) {
    return <div>Not authenticated</div>;
  }

  const project = await getUserProject(userId, params.id);

  if (!project) {
    notFound(); // Returns 404 if project doesn't exist or doesn't belong to user
  }

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
    </div>
  );
}
```

## Rule 3: Use Drizzle ORM - NO RAW SQL

**All database queries MUST use Drizzle ORM. Raw SQL queries are PROHIBITED.**

### ✅ CORRECT - Drizzle ORM

```tsx
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Simple query
export async function getUserProjects(userId: string) {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

// Query with relations
export async function getUserProjectWithTasks(userId: string, projectId: string) {
  return await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.userId, userId)
    ),
    with: {
      tasks: true
    }
  });
}

// Insert
export async function createProject(userId: string, data: { name: string; description: string }) {
  const result = await db
    .insert(projects)
    .values({
      userId,
      name: data.name,
      description: data.description,
      createdAt: new Date()
    })
    .returning();

  return result[0];
}

// Update
export async function updateProject(
  userId: string,
  projectId: string,
  data: { name: string; description: string }
) {
  const result = await db
    .update(projects)
    .set(data)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId) // CRITICAL: Prevent updating other users' data
      )
    )
    .returning();

  return result[0];
}

// Delete
export async function deleteProject(userId: string, projectId: string) {
  await db
    .delete(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId) // CRITICAL: Prevent deleting other users' data
      )
    );
}
```

### ❌ INCORRECT - Raw SQL

```tsx
// ❌ NEVER DO THIS
export async function getUserProjects(userId: string) {
  const result = await db.execute(`
    SELECT * FROM projects WHERE user_id = '${userId}'
  `); // SQL injection risk, no type safety, violates project standards

  return result;
}
```

### Why Drizzle ORM?

1. **Type Safety** - TypeScript types are inferred from schema
2. **SQL Injection Prevention** - Parameterized queries by default
3. **Better Developer Experience** - Autocomplete and type checking
4. **Maintainability** - Easier to refactor and understand
5. **Performance** - Optimized query generation

## Rule 4: ALWAYS Filter by User ID

**CRITICAL: Every database query MUST filter by the authenticated user's ID.**

This ensures users can ONLY access their own data and cannot access other users' data.

### ✅ CORRECT - Always Filter by userId

```tsx
// GOOD: Every query includes userId filter
export async function getUserTask(userId: string, taskId: string) {
  return await db.query.tasks.findFirst({
    where: and(
      eq(tasks.id, taskId),
      eq(tasks.userId, userId) // ✅ REQUIRED
    )
  });
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: { title: string }
) {
  return await db
    .update(tasks)
    .set(data)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.userId, userId) // ✅ REQUIRED - Prevents updating other users' tasks
      )
    )
    .returning();
}
```

### ❌ INCORRECT - Missing userId Filter

```tsx
// ❌ DANGEROUS: No userId filter - user could access ANY task by ID
export async function getTask(taskId: string) {
  return await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId) // ❌ MISSING userId filter
  });
}

// ❌ DANGEROUS: User could update ANY task, not just their own
export async function updateTask(taskId: string, data: { title: string }) {
  return await db
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, taskId)) // ❌ MISSING userId filter
    .returning();
}
```

### Security Checklist

Before committing any data helper function, verify:

- [ ] Function accepts `userId` as first parameter
- [ ] Query filters by `userId` in WHERE clause
- [ ] Update operations filter by `userId`
- [ ] Delete operations filter by `userId`
- [ ] Join queries filter related tables by `userId` where applicable
- [ ] Function is documented with JSDoc comments
- [ ] Return type is properly typed

## Complete Example: CRUD Operations

Here's a complete example showing proper implementation of all CRUD operations:

```tsx
// data/projects.ts
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// CREATE
export async function createProject(
  userId: string,
  data: { name: string; description: string | null }
) {
  const result = await db
    .insert(projects)
    .values({
      userId,
      ...data,
      createdAt: new Date()
    })
    .returning();

  return result[0];
}

// READ (list)
export async function getUserProjects(userId: string) {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

// READ (single)
export async function getUserProject(userId: string, projectId: string) {
  const result = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    )
    .limit(1);

  return result[0] || null;
}

// UPDATE
export async function updateProject(
  userId: string,
  projectId: string,
  data: { name?: string; description?: string | null }
) {
  const result = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    )
    .returning();

  return result[0] || null;
}

// DELETE
export async function deleteProject(userId: string, projectId: string) {
  const result = await db
    .delete(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    )
    .returning();

  return result[0] || null;
}
```

```tsx
// app/projects/page.tsx - Using the data helper functions
import { auth } from "@clerk/nextjs/server";
import { getUserProjects } from "@/data/projects";
import Link from "next/link";

export default async function ProjectsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const projects = await getUserProjects(userId);

  return (
    <div>
      <h1>My Projects</h1>
      {projects.length === 0 ? (
        <p>No projects yet. Create your first project!</p>
      ) : (
        <ul>
          {projects.map(project => (
            <li key={project.id}>
              <Link href={`/projects/${project.id}`}>
                {project.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Summary

### The Four Non-Negotiable Rules

1. **Server Components ONLY** - All data fetching happens in Server Components
2. **Data Helper Functions** - All database queries go through `/data` directory functions
3. **Drizzle ORM** - No raw SQL, always use Drizzle ORM
4. **Filter by User ID** - Every query MUST filter by the authenticated user's ID

### Benefits of This Approach

- ✅ **Security** - Users can only access their own data
- ✅ **Type Safety** - Full TypeScript support throughout
- ✅ **Performance** - No unnecessary API layer
- ✅ **Maintainability** - Centralized data access logic
- ✅ **Scalability** - Easy to add caching and optimization
- ✅ **Testing** - Data functions can be unit tested independently

### When You Need Client Interactivity

If you need client-side interactivity (forms, buttons, etc.), use Server Actions:

```tsx
// app/projects/actions.ts
"use server"

import { auth } from "@clerk/nextjs/server";
import { createProject } from "@/data/projects";
import { revalidatePath } from "next/cache";

export async function createProjectAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  await createProject(userId, { name, description });

  revalidatePath("/projects");
}
```

```tsx
// app/projects/create-project-form.tsx
"use client"

import { createProjectAction } from "./actions";

export function CreateProjectForm() {
  return (
    <form action={createProjectAction}>
      <input name="name" type="text" required />
      <textarea name="description" />
      <button type="submit">Create Project</button>
    </form>
  );
}
```

This approach keeps data fetching in Server Components while allowing client-side form handling.
