"use client"

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock workout data for UI demonstration
  const mockWorkouts = [
    {
      id: 1,
      name: "Morning Run",
      duration: "30 min",
      calories: 250,
      time: "07:00 AM"
    },
    {
      id: 2,
      name: "Upper Body Strength",
      duration: "45 min",
      calories: 320,
      time: "05:30 PM"
    },
    {
      id: 3,
      name: "Evening Yoga",
      duration: "20 min",
      calories: 80,
      time: "08:00 PM"
    }
  ];

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
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>
                Choose a date to view workouts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Workouts List Section */}
          <Card>
            <CardHeader>
              <CardTitle>Workouts</CardTitle>
              <CardDescription>
                {date ? format(date, "do MMM yyyy") : "No date selected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockWorkouts.length > 0 ? (
                <div className="space-y-4">
                  {mockWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-black dark:text-zinc-50">
                          {workout.name}
                        </h3>
                        <div className="mt-1 flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                          <span>{workout.time}</span>
                          <span>•</span>
                          <span>{workout.duration}</span>
                          <span>•</span>
                          <span>{workout.calories} cal</span>
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
              Overview for {date ? format(date, "do MMM yyyy") : "selected date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Workouts
                </p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-zinc-50">
                  {mockWorkouts.length}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Duration
                </p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-zinc-50">
                  95 min
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Calories
                </p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-zinc-50">
                  650 cal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
