import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserWorkout } from "@/data/workouts";
import { EditWorkoutForm } from "./edit-workout-form";

interface PageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function EditWorkoutPage({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    redirect("/dashboard");
  }

  const workout = await getUserWorkout(userId, workoutIdNum);

  if (!workout) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Workout</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Update your workout details and exercises.
        </p>
      </div>

      <EditWorkoutForm workout={workout} />
    </div>
  );
}
