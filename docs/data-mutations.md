# Data Mutations

## CRITICAL RULES

This document outlines the **mandatory** approach for data mutations (create, update, delete operations) in this application. These rules are non-negotiable and must be followed in all circumstances.

## Rule 1: Server Actions ONLY

**ALL data mutations MUST be done via Server Actions in colocated `actions.ts` files.**

### ✅ CORRECT - Server Action in Colocated File

```tsx
// app/workouts/actions.ts
"use server"

import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Define validation schema
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  description: z.string().optional(),
  duration: z.number().positive("Duration must be positive"),
});

// Typed parameters - NO FormData
export async function createWorkoutAction(data: {
  name: string;
  description?: string;
  duration: number;
}) {
  // CRITICAL: Authenticate user
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // CRITICAL: Validate input with Zod
  const validated = createWorkoutSchema.parse(data);

  // Call data helper function
  const workout = await createWorkout(userId, validated);

  // Revalidate the page to show updated data
  revalidatePath("/workouts");

  return workout;
}
```

### ❌ INCORRECT - FormData Parameters

```tsx
// app/workouts/actions.ts
"use server"

// ❌ WRONG - Don't use FormData as parameter type
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name") as string;
  const duration = formData.get("duration") as string;

  // ❌ No type safety, no validation, error-prone
  await createWorkout(userId, { name, duration: Number(duration) });
}
```

### ❌ INCORRECT - API Route Handler for Mutations

```tsx
// app/api/workouts/route.ts

// ❌ WRONG - Don't use API route handlers for mutations
export async function POST(request: Request) {
  const body = await request.json();
  await createWorkout(userId, body);
  return Response.json({ success: true });
}
```

### ❌ INCORRECT - Server Action Not Colocated

```tsx
// ❌ WRONG - Don't put all actions in a single global file
// app/actions/workouts.ts
"use server"

export async function createWorkoutAction(data: any) {
  // ...
}
```

### Why Server Actions Only?

1. **Type Safety** - Strongly typed parameters ensure compile-time validation
2. **Security** - Built-in CSRF protection
3. **Performance** - No need for separate API routes
4. **Developer Experience** - Direct function calls from client components
5. **Colocation** - Actions are colocated with the features that use them
6. **Progressive Enhancement** - Forms work without JavaScript

## Rule 2: Typed Parameters - NO FormData

**Server Actions MUST have explicitly typed parameters. FormData type is PROHIBITED.**

### ✅ CORRECT - Typed Parameters

```tsx
// app/exercises/actions.ts
"use server"

import { z } from "zod";

// Define types for your action parameters
type CreateExerciseInput = {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
};

const createExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().positive().optional(),
});

export async function createExerciseAction(data: CreateExerciseInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Validate with Zod
  const validated = createExerciseSchema.parse(data);

  const exercise = await createExercise(userId, validated);

  revalidatePath("/exercises");

  return exercise;
}
```

### ✅ CORRECT - Using Zod for Type Inference

```tsx
// app/exercises/actions.ts
"use server"

import { z } from "zod";

// Define schema first
const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sets: z.number().int().positive("Sets must be positive"),
  reps: z.number().int().positive("Reps must be positive"),
  weight: z.number().positive("Weight must be positive").optional(),
});

// Infer type from schema
type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

export async function createExerciseAction(data: CreateExerciseInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const validated = createExerciseSchema.parse(data);

  const exercise = await createExercise(userId, validated);

  revalidatePath("/exercises");

  return exercise;
}
```

### ❌ INCORRECT - FormData Type

```tsx
// ❌ WRONG - Don't use FormData as parameter type
export async function createExerciseAction(formData: FormData) {
  const name = formData.get("name"); // any type, no validation
  const sets = Number(formData.get("sets")); // runtime conversion, error-prone

  // No type safety!
  await createExercise(userId, { name, sets });
}
```

### Why Typed Parameters?

1. **Type Safety** - Catch errors at compile time, not runtime
2. **Better Developer Experience** - Autocomplete and IntelliSense
3. **Self-Documenting** - Parameter types clearly show what's expected
4. **Easier Testing** - Mock data with proper types
5. **Refactoring Safety** - TypeScript catches breaking changes

## Rule 3: ALWAYS Validate with Zod

**ALL Server Actions MUST validate their input parameters using Zod schemas.**

### ✅ CORRECT - Zod Validation with Error Handling

```tsx
// app/workouts/actions.ts
"use server"

import { auth } from "@clerk/nextjs/server";
import { updateWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateWorkoutSchema = z.object({
  id: z.string().uuid("Invalid workout ID"),
  name: z.string().min(1, "Workout name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  duration: z.number().int().positive("Duration must be positive").max(480, "Duration too long"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"], {
    errorMap: () => ({ message: "Invalid difficulty level" })
  }),
});

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export async function updateWorkoutAction(data: UpdateWorkoutInput) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Not authenticated"
    };
  }

  try {
    // CRITICAL: Validate with Zod
    const validated = updateWorkoutSchema.parse(data);

    const workout = await updateWorkout(userId, validated.id, {
      name: validated.name,
      description: validated.description,
      duration: validated.duration,
      difficulty: validated.difficulty,
    });

    if (!workout) {
      return {
        success: false,
        error: "Workout not found or access denied"
      };
    }

    revalidatePath("/workouts");
    revalidatePath(`/workouts/${validated.id}`);

    return {
      success: true,
      data: workout
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.issues
      };
    }

    throw error;
  }
}
```

### ✅ CORRECT - Zod SafeParse for Better Error Handling

```tsx
// app/exercises/actions.ts
"use server"

import { z } from "zod";

const deleteExerciseSchema = z.object({
  id: z.string().uuid("Invalid exercise ID"),
});

type DeleteExerciseInput = z.infer<typeof deleteExerciseSchema>;

export async function deleteExerciseAction(data: DeleteExerciseInput) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Not authenticated"
    };
  }

  // Use safeParse for better error handling
  const result = deleteExerciseSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: "Invalid input",
      issues: result.error.issues
    };
  }

  const deleted = await deleteExercise(userId, result.data.id);

  if (!deleted) {
    return {
      success: false,
      error: "Exercise not found or access denied"
    };
  }

  revalidatePath("/exercises");

  return {
    success: true
  };
}
```

### ❌ INCORRECT - No Validation

```tsx
// ❌ WRONG - No validation, accepts any input
export async function updateWorkoutAction(data: any) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // ❌ No validation! User could send malicious data
  await updateWorkout(userId, data.id, data);

  revalidatePath("/workouts");
}
```

### ❌ INCORRECT - Manual Validation

```tsx
// ❌ WRONG - Manual validation is error-prone
export async function createWorkoutAction(data: {
  name: string;
  duration: number;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // ❌ Manual validation is verbose and error-prone
  if (!data.name || data.name.length === 0) {
    throw new Error("Name is required");
  }

  if (typeof data.duration !== "number" || data.duration <= 0) {
    throw new Error("Duration must be positive");
  }

  await createWorkout(userId, data);

  revalidatePath("/workouts");
}
```

### Why Zod Validation?

1. **Security** - Prevents malicious or malformed input
2. **Data Integrity** - Ensures data meets business rules
3. **Type Safety** - Runtime validation matches TypeScript types
4. **Better Error Messages** - Detailed validation errors for users
5. **Consistency** - Same validation rules across application
6. **Documentation** - Schema serves as API documentation

## Rule 4: Use Data Helper Functions in `/data` Directory

**Data mutations MUST be performed through helper functions in the `/data` directory that wrap Drizzle ORM calls.**

### Directory Structure

```
/data
  ├── workouts.ts      # Workout CRUD operations
  ├── exercises.ts     # Exercise CRUD operations
  ├── sets.ts          # Set CRUD operations
  └── ... (other entities)
```

### ✅ CORRECT - Data Helper Function for Mutations

```tsx
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Create a new workout for a user
 * @param userId - The authenticated user's ID from Clerk
 * @param data - Workout data to create
 * @returns The created workout
 */
export async function createWorkout(
  userId: string,
  data: {
    name: string;
    description?: string;
    duration: number;
  }
) {
  const result = await db
    .insert(workouts)
    .values({
      userId,
      name: data.name,
      description: data.description,
      duration: data.duration,
      createdAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * Update a workout, ensuring it belongs to the user
 * @param userId - The authenticated user's ID from Clerk
 * @param workoutId - The workout ID to update
 * @param data - Updated workout data
 * @returns The updated workout or null if not found/unauthorized
 */
export async function updateWorkout(
  userId: string,
  workoutId: string,
  data: {
    name?: string;
    description?: string;
    duration?: number;
  }
) {
  const result = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Prevent updating other users' data
      )
    )
    .returning();

  return result[0] || null;
}

/**
 * Delete a workout, ensuring it belongs to the user
 * @param userId - The authenticated user's ID from Clerk
 * @param workoutId - The workout ID to delete
 * @returns The deleted workout or null if not found/unauthorized
 */
export async function deleteWorkout(userId: string, workoutId: string) {
  const result = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // CRITICAL: Prevent deleting other users' data
      )
    )
    .returning();

  return result[0] || null;
}
```

### ✅ CORRECT - Server Action Using Helper Function

```tsx
// app/workouts/actions.ts
"use server"

import { auth } from "@clerk/nextjs/server";
import { createWorkout, updateWorkout, deleteWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  duration: z.number().positive("Duration must be positive"),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(data: CreateWorkoutInput) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const result = createWorkoutSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: result.error.issues
    };
  }

  // Call data helper function
  const workout = await createWorkout(userId, result.data);

  revalidatePath("/workouts");

  return { success: true, data: workout };
}
```

### ❌ INCORRECT - Direct Database Access in Server Action

```tsx
// app/workouts/actions.ts
"use server"

import { db } from "@/db";
import { workouts } from "@/db/schema";

// ❌ WRONG - Don't access database directly in server actions
export async function createWorkoutAction(data: any) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // ❌ Database logic should be in /data helper functions
  const result = await db
    .insert(workouts)
    .values({
      userId,
      ...data,
      createdAt: new Date(),
    })
    .returning();

  return result[0];
}
```

### Why Data Helper Functions?

1. **Separation of Concerns** - Data access logic separated from action logic
2. **Reusability** - Same helper can be used by multiple actions or server components
3. **Testability** - Data functions can be unit tested independently
4. **Consistency** - Centralized data access ensures consistent patterns
5. **Security** - userId filtering enforced in one place
6. **Maintainability** - Easier to update database queries in one location

## Rule 5: Proper Error Handling and Response Types

**Server Actions MUST return structured response objects with success/error states.**

### ✅ CORRECT - Structured Response Type

```tsx
// app/workouts/actions.ts
"use server"

import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWorkoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().positive(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

// Define response type
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] };

export async function createWorkoutAction(
  data: CreateWorkoutInput
): Promise<ActionResponse<{ id: string; name: string }>> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Not authenticated"
    };
  }

  const result = createWorkoutSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: result.error.issues
    };
  }

  try {
    const workout = await createWorkout(userId, result.data);

    revalidatePath("/workouts");

    return {
      success: true,
      data: { id: workout.id, name: workout.name }
    };
  } catch (error) {
    console.error("Failed to create workout:", error);
    return {
      success: false,
      error: "Failed to create workout"
    };
  }
}
```

### ✅ CORRECT - Using Response in Client Component

```tsx
// app/workouts/create-workout-form.tsx
"use client"

import { useState } from "react";
import { createWorkoutAction } from "./actions";

export function CreateWorkoutForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    const result = await createWorkoutAction({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      duration: Number(formData.get("duration")),
    });

    setIsPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Success! Handle navigation or UI update
    console.log("Created workout:", result.data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" type="text" required />
      <textarea name="description" />
      <input name="duration" type="number" required />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Workout"}
      </button>
    </form>
  );
}
```

### ❌ INCORRECT - Throwing Errors

```tsx
// ❌ WRONG - Don't throw errors from server actions
export async function createWorkoutAction(data: any) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated"); // ❌ Hard to handle in client
  }

  // ❌ Validation errors crash the action
  const validated = createWorkoutSchema.parse(data);

  const workout = await createWorkout(userId, validated);

  return workout; // ❌ No structured response
}
```

### Why Structured Responses?

1. **Better Error Handling** - Client can handle errors gracefully
2. **Type Safety** - TypeScript knows the shape of success/error
3. **User Experience** - Show specific error messages to users
4. **Debugging** - Easier to track down issues
5. **Consistency** - All actions return the same response structure

## Complete Example: Full CRUD with Server Actions

Here's a complete example showing all mutation operations following best practices:

```tsx
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// CREATE
export async function createWorkout(
  userId: string,
  data: { name: string; description?: string; duration: number }
) {
  const result = await db
    .insert(workouts)
    .values({
      userId,
      ...data,
      createdAt: new Date(),
    })
    .returning();

  return result[0];
}

// UPDATE
export async function updateWorkout(
  userId: string,
  workoutId: string,
  data: { name?: string; description?: string; duration?: number }
) {
  const result = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .returning();

  return result[0] || null;
}

// DELETE
export async function deleteWorkout(userId: string, workoutId: string) {
  const result = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .returning();

  return result[0] || null;
}
```

```tsx
// app/workouts/actions.ts
"use server"

import { auth } from "@clerk/nextjs/server";
import {
  createWorkout,
  updateWorkout,
  deleteWorkout
} from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Define schemas
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive().max(480),
});

const updateWorkoutSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive().max(480).optional(),
});

const deleteWorkoutSchema = z.object({
  id: z.string().uuid(),
});

// Infer types
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
type DeleteWorkoutInput = z.infer<typeof deleteWorkoutSchema>;

// Response type
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] };

// CREATE ACTION
export async function createWorkoutAction(
  data: CreateWorkoutInput
): Promise<ActionResponse<{ id: string; name: string }>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const result = createWorkoutSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: result.error.issues
    };
  }

  try {
    const workout = await createWorkout(userId, result.data);
    revalidatePath("/workouts");
    return { success: true, data: { id: workout.id, name: workout.name } };
  } catch (error) {
    console.error("Failed to create workout:", error);
    return { success: false, error: "Failed to create workout" };
  }
}

// UPDATE ACTION
export async function updateWorkoutAction(
  data: UpdateWorkoutInput
): Promise<ActionResponse<{ id: string; name: string }>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const result = updateWorkoutSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: result.error.issues
    };
  }

  try {
    const { id, ...updates } = result.data;
    const workout = await updateWorkout(userId, id, updates);

    if (!workout) {
      return { success: false, error: "Workout not found or access denied" };
    }

    revalidatePath("/workouts");
    revalidatePath(`/workouts/${id}`);
    return { success: true, data: { id: workout.id, name: workout.name } };
  } catch (error) {
    console.error("Failed to update workout:", error);
    return { success: false, error: "Failed to update workout" };
  }
}

// DELETE ACTION
export async function deleteWorkoutAction(
  data: DeleteWorkoutInput
): Promise<ActionResponse<void>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const result = deleteWorkoutSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: result.error.issues
    };
  }

  try {
    const workout = await deleteWorkout(userId, result.data.id);

    if (!workout) {
      return { success: false, error: "Workout not found or access denied" };
    }

    revalidatePath("/workouts");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete workout:", error);
    return { success: false, error: "Failed to delete workout" };
  }
}
```

```tsx
// app/workouts/workout-actions.tsx
"use client"

import { useState } from "react";
import { updateWorkoutAction, deleteWorkoutAction } from "./actions";

export function WorkoutActions({ workoutId }: { workoutId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this workout?")) {
      return;
    }

    setError(null);
    setIsPending(true);

    const result = await deleteWorkoutAction({ id: workoutId });

    setIsPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Success - navigate or update UI
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleDelete} disabled={isPending}>
        {isPending ? "Deleting..." : "Delete Workout"}
      </button>
    </div>
  );
}
```

## Summary

### The Five Non-Negotiable Rules

1. **Server Actions ONLY** - All mutations via server actions in colocated `actions.ts` files
2. **Typed Parameters** - Use explicit types, NEVER use FormData type
3. **Zod Validation** - ALWAYS validate input with Zod schemas
4. **Data Helper Functions** - All database operations through `/data` directory functions using Drizzle ORM
5. **Structured Responses** - Return `{ success, data?, error? }` objects, never throw errors

### Benefits of This Approach

- ✅ **Type Safety** - Full TypeScript coverage from client to database
- ✅ **Security** - Built-in CSRF protection, input validation, user isolation
- ✅ **Validation** - Zod ensures data integrity
- ✅ **Maintainability** - Clear separation of concerns
- ✅ **Developer Experience** - Direct function calls, autocomplete, type checking
- ✅ **Testing** - Easy to unit test data functions and actions independently
- ✅ **Error Handling** - Graceful error handling with structured responses

### Checklist for Every Server Action

Before committing any server action, verify:

- [ ] Action is in a colocated `actions.ts` file
- [ ] File starts with `"use server"` directive
- [ ] Parameters are explicitly typed (NOT FormData)
- [ ] Zod schema defined for validation
- [ ] User authentication checked with `await auth()`
- [ ] Input validated with Zod `.safeParse()` or `.parse()`
- [ ] Data mutation done via helper function from `/data`
- [ ] Helper function filters by `userId`
- [ ] `revalidatePath()` called after mutation
- [ ] Returns structured response object `{ success, data?, error? }`
- [ ] Errors handled gracefully, not thrown
- [ ] Response type explicitly defined

### Migration Guide

If you have existing server actions that don't follow these patterns:

1. **Move to colocated `actions.ts` files** - Group actions by feature
2. **Add explicit type parameters** - Remove FormData, add typed objects
3. **Add Zod validation** - Create schemas and validate input
4. **Extract database logic** - Move queries to `/data` helper functions
5. **Add structured responses** - Return `{ success, data?, error? }` objects
6. **Update client code** - Handle new response structure

This standardized approach ensures consistency, security, and maintainability across all data mutations in the application.
