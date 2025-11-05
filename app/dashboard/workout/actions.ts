"use server"

import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/data/workouts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Define validation schema
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(255, "Name too long"),
  templateId: z.number().int().positive().optional(),
  startedAt: z.date().optional(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

// Response type
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] };

/**
 * Create a new workout
 */
export async function createWorkoutAction(
  data: CreateWorkoutInput
): Promise<ActionResponse<{ id: number; name: string }>> {
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

    revalidatePath("/dashboard");

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
