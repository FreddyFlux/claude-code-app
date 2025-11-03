import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserWorkoutsByDate } from "@/data/workouts";
import { DashboardContent } from "./dashboard-content";

interface DashboardPageProps {
  searchParams: Promise<{
    date?: string;
    tz?: string; // Timezone offset in minutes
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Await searchParams (Next.js 15+ requirement)
  const params = await searchParams;

  // Parse the date from query params or use today's date
  let selectedDate: Date;
  if (params.date) {
    selectedDate = new Date(params.date);
    // Validate the date
    if (isNaN(selectedDate.getTime())) {
      selectedDate = new Date();
    }
  } else {
    selectedDate = new Date();
  }

  // Parse timezone offset from query params or use current browser timezone
  // Note: On initial page load without tz param, we use 0 (UTC) as default
  // The client will then navigate with the proper timezone offset
  let timezoneOffset: number;
  if (params.tz) {
    timezoneOffset = parseInt(params.tz, 10);
    // Validate timezone offset is in valid range (-720 to +840 minutes)
    if (isNaN(timezoneOffset) || timezoneOffset < -720 || timezoneOffset > 840) {
      timezoneOffset = 0; // Default to UTC if invalid
    }
  } else {
    timezoneOffset = 0; // Default to UTC on initial load
  }

  // Fetch workouts for the selected date with timezone context
  const workouts = await getUserWorkoutsByDate(userId, selectedDate, timezoneOffset);

  // Convert dates to serializable format
  const serializedWorkouts = workouts.map(workout => ({
    ...workout,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
  }));

  return (
    <DashboardContent
      initialWorkouts={serializedWorkouts}
      initialDate={selectedDate}
    />
  );
}
