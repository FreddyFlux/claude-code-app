import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateWorkoutForm } from "./create-workout-form";

export default async function NewWorkoutPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Workout</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Start a new workout session and track your exercises.
        </p>
      </div>

      <CreateWorkoutForm />
    </div>
  );
}
