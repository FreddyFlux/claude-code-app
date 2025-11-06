"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createWorkoutAction } from "../actions";
import { cn } from "@/lib/utils";

// Define validation schema (must match server-side schema)
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(255, "Name too long"),
  startedAt: z.date().optional(),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export function CreateWorkoutForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateWorkoutInput>({
    resolver: zodResolver(createWorkoutSchema),
    defaultValues: {
      name: "",
      startedAt: new Date(),
    },
  });

  async function onSubmit(data: CreateWorkoutInput) {
    setError(null);
    setIsPending(true);

    try {
      const result = await createWorkoutAction(data);

      if (!result.success) {
        setError(result.error);
        setIsPending(false);
        return;
      }

      // Success! Navigate to the dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Failed to create workout:", err);
      setError("An unexpected error occurred");
      setIsPending(false);
    }
  }

  // Prevent hydration mismatch by only rendering after client mount
  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
          <CardDescription>
            Give your workout a name to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-10 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Details</CardTitle>
        <CardDescription>
          Give your workout a name to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Workout Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Morning Chest Day, Leg Workout"
              {...register("name")}
              disabled={isPending}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Start Date & Time</Label>
            <Controller
              control={control}
              name="startedAt"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "do MMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.startedAt && (
              <p className="text-sm text-red-500">{errors.startedAt.message}</p>
            )}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select when you started or plan to start this workout
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Creating..." : "Start Workout"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
