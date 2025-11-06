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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateWorkoutAction } from "../actions";
import { cn } from "@/lib/utils";

// Define validation schema (must match server-side schema)
const updateWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(255, "Name too long"),
  startedAt: z.date().optional(),
  status: z.enum(["in_progress", "completed", "cancelled"]),
  durationSeconds: z.number().int().positive().optional(),
});

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

interface Workout {
  id: number;
  name: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  workoutExercises?: any[];
}

interface EditWorkoutFormProps {
  workout: Workout;
}

export function EditWorkoutForm({ workout }: EditWorkoutFormProps) {
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
  } = useForm<UpdateWorkoutInput>({
    resolver: zodResolver(updateWorkoutSchema),
    defaultValues: {
      name: workout.name,
      startedAt: new Date(workout.startedAt),
      status: workout.status as "in_progress" | "completed" | "cancelled",
      durationSeconds: workout.durationSeconds || undefined,
    },
  });

  async function onSubmit(data: UpdateWorkoutInput) {
    setError(null);
    setIsPending(true);

    try {
      const result = await updateWorkoutAction(workout.id, data);

      if (!result.success) {
        setError(result.error);
        setIsPending(false);
        return;
      }

      // Success! Navigate to the dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Failed to update workout:", err);
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
            Update your workout information
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
          Update your workout information
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationSeconds">
              Duration (minutes)
            </Label>
            <Input
              id="durationSeconds"
              type="number"
              placeholder="e.g., 45"
              {...register("durationSeconds", {
                valueAsNumber: true,
                setValueAs: (value) => {
                  if (value === "" || value === null || value === undefined) return undefined;
                  const minutes = parseInt(value, 10);
                  return isNaN(minutes) ? undefined : minutes * 60;
                }
              })}
              defaultValue={workout.durationSeconds ? Math.floor(workout.durationSeconds / 60) : undefined}
              disabled={isPending}
              className={errors.durationSeconds ? "border-red-500" : ""}
            />
            {errors.durationSeconds && (
              <p className="text-sm text-red-500">{errors.durationSeconds.message}</p>
            )}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              How long did this workout take?
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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
