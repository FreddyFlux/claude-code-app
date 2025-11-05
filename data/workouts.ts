import { db } from "@/app/db";
import { workouts, workoutExercises, exercises, sets } from "@/app/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Get all workouts for a specific user on a specific date
 * @param userId - The authenticated user's ID from Clerk
 * @param date - The date to fetch workouts for (as UTC midnight)
 * @param timezoneOffset - User's timezone offset in minutes (from Date.getTimezoneOffset())
 *                         Positive values are behind UTC, negative values are ahead
 *                         Example: PST (UTC-8) = 480, CET (UTC+1) = -60
 * @returns Array of workouts with exercises and sets for the given date
 */
export async function getUserWorkoutsByDate(userId: string, date: Date, timezoneOffset: number = 0) {
  // Calculate UTC range for the user's local day
  // Example: User in PST (offset=480) selects "2025-01-01"
  // - date param is "2025-01-01T00:00:00.000Z" (midnight UTC)
  // - We want: "2025-01-01 00:00 PST" to "2025-01-01 23:59 PST"
  // - In UTC: "2025-01-01 08:00 UTC" to "2025-01-02 07:59 UTC"

  const startOfDay = new Date(date.getTime() + timezoneOffset * 60 * 1000);
  const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);

  return await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, startOfDay),
      lte(workouts.startedAt, endOfDay)
    ),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: true,
        },
      },
    },
    orderBy: [desc(workouts.startedAt)],
  });
}

/**
 * Get a single workout by ID, ensuring it belongs to the user
 * @param userId - The authenticated user's ID from Clerk
 * @param workoutId - The workout ID to fetch
 * @returns Workout with exercises and sets if found and belongs to user, null otherwise
 */
export async function getUserWorkout(userId: string, workoutId: number) {
  return await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: true,
        },
      },
    },
  });
}

/**
 * Get all workouts for a specific user
 * @param userId - The authenticated user's ID from Clerk
 * @returns Array of workouts ordered by start date (most recent first)
 */
export async function getUserWorkouts(userId: string) {
  return await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: [desc(workouts.startedAt)],
  });
}

/**
 * Calculate total calories burned for a workout
 * This is a simplified calculation based on exercise count and sets
 * @param workout - The workout object with exercises and sets
 * @returns Estimated calories burned
 */
export function calculateWorkoutCalories(workout: any): number {
  if (!workout.workoutExercises || workout.workoutExercises.length === 0) {
    return 0;
  }

  // Simple estimation: each completed set burns approximately 10-15 calories
  // This is a rough estimate and should be replaced with more accurate calculations
  let totalCalories = 0;

  for (const workoutExercise of workout.workoutExercises) {
    if (workoutExercise.sets) {
      const completedSets = workoutExercise.sets.filter((set: any) => set.completed);
      totalCalories += completedSets.length * 12; // Average 12 calories per set
    }
  }

  return totalCalories;
}

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
    templateId?: number;
    startedAt?: Date;
  }
) {
  const result = await db
    .insert(workouts)
    .values({
      userId,
      name: data.name,
      templateId: data.templateId,
      status: "in_progress",
      startedAt: data.startedAt || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * Format workout duration from seconds to human-readable string
 * @param durationSeconds - Duration in seconds
 * @returns Formatted duration string (e.g., "45 min", "1h 30 min")
 */
export function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return "N/A";
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes} min`;
  }

  return `${minutes} min`;
}
