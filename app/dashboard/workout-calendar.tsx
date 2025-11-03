"use client"

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkoutCalendarProps {
  onDateSelect: (date: Date | undefined) => void;
  initialDate?: Date;
}

export function WorkoutCalendar({ onDateSelect, initialDate }: WorkoutCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateSelect(newDate);
  };

  return (
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
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  );
}
