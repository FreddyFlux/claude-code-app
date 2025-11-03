"use client"

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkoutCalendar } from "./workout-calendar";

interface WorkoutData {
  id: number;
  name: string;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  status: string;
  workoutExercises: Array<{
    id: number;
    exercise: {
      id: number;
      name: string;
    };
    sets: Array<{
      id: number;
      completed: boolean;
    }>;
  }>;
}

interface DashboardContentProps {
  initialWorkouts: WorkoutData[];
  initialDate: Date;
}

export function DashboardContent({ initialWorkouts, initialDate }: DashboardContentProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // On initial mount, if timezone is not in URL, navigate with it to ensure correct data
  useEffect(() => {
    const tzParam = searchParams.get('tz');
    if (!tzParam) {
      const timezoneOffset = new Date().getTimezoneOffset();
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      router.replace(`/dashboard?date=${dateStr}&tz=${timezoneOffset}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);

    // Navigate to the same page with the new date and timezone as query parameters
    startTransition(() => {
      const dateStr = format(date, "yyyy-MM-dd");
      // Get timezone offset in minutes (negative for ahead of UTC, positive for behind)
      const timezoneOffset = date.getTimezoneOffset();
      router.push(`/dashboard?date=${dateStr}&tz=${timezoneOffset}`);
    });
  };

  // Calculate statistics
  const totalWorkouts = initialWorkouts.length;

  const totalDuration = initialWorkouts.reduce((sum, workout) => {
    return sum + (workout.durationSeconds || 0);
  }, 0);

  const totalCalories = initialWorkouts.reduce((sum, workout) => {
    // Calculate calories for each workout
    let workoutCalories = 0;
    for (const workoutExercise of workout.workoutExercises) {
      const completedSets = workoutExercise.sets.filter(set => set.completed);
      workoutCalories += completedSets.length * 12; // Average 12 calories per set
    }
    return sum + workoutCalories;
  }, 0);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const formatWorkoutTime = (date: Date) => {
    return format(date, "hh:mm a");
  };

  const getWorkoutDuration = (workout: WorkoutData) => {
    if (workout.durationSeconds) {
      return formatDuration(workout.durationSeconds);
    }
    return "N/A";
  };

  const getWorkoutCalories = (workout: WorkoutData) => {
    let calories = 0;
    for (const workoutExercise of workout.workoutExercises) {
      const completedSets = workoutExercise.sets.filter(set => set.completed);
      calories += completedSets.length * 12;
    }
    return calories;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Workout Dashboard
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Track and manage your daily workouts
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendar Section */}
          <WorkoutCalendar
            onDateSelect={handleDateSelect}
            initialDate={selectedDate}
          />

          {/* Workouts List Section */}
          <Card>
            <CardHeader>
              <CardTitle>Workouts</CardTitle>
              <CardDescription>
                {format(selectedDate, "do MMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
                </div>
              ) : initialWorkouts.length > 0 ? (
                <div className="space-y-4">
                  {initialWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-black dark:text-zinc-50">
                          {workout.name}
                        </h3>
                        <div className="mt-1 flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                          <span>{formatWorkoutTime(new Date(workout.startedAt))}</span>
                          <span>•</span>
                          <span>{getWorkoutDuration(workout)}</span>
                          <span>•</span>
                          <span>{getWorkoutCalories(workout)} cal</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-center">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No workouts logged for this date
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
            <CardDescription>
              Overview for {format(selectedDate, "do MMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Workouts
                </p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-zinc-50">
                  {totalWorkouts}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Duration
                </p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-zinc-50">
                  {totalDuration > 0 ? formatDuration(totalDuration) : "0 min"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Calories
                </p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-zinc-50">
                  {totalCalories} cal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
