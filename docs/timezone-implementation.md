# Timezone Implementation for Workout Calendar

## Overview

The workout calendar now properly handles timezones to ensure users see workouts on the correct day regardless of their timezone.

## How It Works

### 1. Client-Side: Detecting Timezone

When a user selects a date in the calendar:

```typescript
const timezoneOffset = date.getTimezoneOffset(); // Minutes behind UTC
```

**Examples:**
- PST (UTC-8): `480` (480 minutes behind UTC)
- EST (UTC-5): `300`
- CET (UTC+1): `-60` (60 minutes ahead of UTC)
- JST (UTC+9): `-540`

### 2. URL Structure

The date and timezone are passed as query parameters:

```
/dashboard?date=2025-01-01&tz=480
```

### 3. Server-Side: Calculating UTC Range

The server calculates the UTC time range for the user's local day:

```typescript
// Example: User in PST (offset=480) selects "2025-01-01"
const date = new Date("2025-01-01"); // 2025-01-01T00:00:00.000Z
const startOfDay = new Date(date.getTime() + 480 * 60 * 1000); // 2025-01-01T08:00:00.000Z
const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1); // 2025-01-02T07:59:59.999Z
```

This ensures the query fetches all workouts that occurred during "2025-01-01" in PST timezone.

## Test Scenarios

### Scenario 1: User in PST (UTC-8)

**User Action:** Selects January 1st, 2025

**Client sends:**
- `date=2025-01-01`
- `tz=480`

**Server calculates:**
- Start: `2025-01-01T08:00:00.000Z` (midnight PST = 8 AM UTC)
- End: `2025-01-02T07:59:59.999Z` (11:59:59 PM PST = 7:59 AM next day UTC)

**Result:** Fetches all workouts with `startedAt` between those UTC times

**Example workout:**
- User creates workout at 6:00 PM PST on Jan 1st
- Stored in DB as: `2025-01-02T02:00:00.000Z`
- ✅ Falls within range, appears on Jan 1st

### Scenario 2: User in CET (UTC+1)

**User Action:** Selects January 1st, 2025

**Client sends:**
- `date=2025-01-01`
- `tz=-60` (negative because ahead of UTC)

**Server calculates:**
- Start: `2025-01-01T00:00:00.000Z` - 60min = `2024-12-31T23:00:00.000Z`
- End: `2024-12-31T23:00:00.000Z` + 24h = `2025-01-01T22:59:59.999Z`

**Result:** Fetches workouts from 11 PM Dec 31 UTC to 11 PM Jan 1 UTC

**Example workout:**
- User creates workout at 10:00 PM CET on Jan 1st
- Stored in DB as: `2025-01-01T21:00:00.000Z`
- ✅ Falls within range, appears on Jan 1st

### Scenario 3: User in JST (UTC+9)

**User Action:** Selects January 1st, 2025

**Client sends:**
- `date=2025-01-01`
- `tz=-540`

**Server calculates:**
- Start: `2025-01-01T00:00:00.000Z` + (-540 * 60 * 1000) = `2024-12-31T15:00:00.000Z`
- End: `2025-01-01T14:59:59.999Z`

**Result:** Fetches workouts from 3 PM Dec 31 UTC to 3 PM Jan 1 UTC

**Example workout:**
- User creates workout at 11:00 PM JST on Jan 1st
- Stored in DB as: `2025-01-01T14:00:00.000Z`
- ✅ Falls within range, appears on Jan 1st

## Edge Cases Handled

### 1. Initial Page Load Without Timezone

If user navigates to `/dashboard` without query params:
- Server defaults to UTC (tz=0)
- Client detects missing `tz` param on mount
- Client navigates to `/dashboard?date=YYYY-MM-DD&tz=XXX` with proper timezone
- This triggers a fresh server render with correct data

### 2. Invalid Timezone Values

Validation ensures timezone offset is in valid range (-720 to +840 minutes):
- Invalid values default to 0 (UTC)
- Prevents errors from malformed URLs

### 3. Date Across Timezone Boundaries

When querying for a date, the UTC range may span two calendar days:
- This is intentional and correct
- Ensures all workouts from the user's local day are included

## Benefits

✅ Users see workouts on the correct day in their timezone
✅ Works for all timezones worldwide
✅ No timezone data stored in database (keeps DB clean)
✅ Traveling users see workouts based on current timezone
✅ URL remains readable: `/dashboard?date=2025-01-01&tz=480`

## Files Modified

1. `app/dashboard/dashboard-content.tsx` - Adds timezone offset to URL on date selection
2. `app/dashboard/page.tsx` - Reads and validates timezone parameter
3. `data/workouts.ts` - Accepts timezone offset and calculates UTC range
4. `docs/timezone-implementation.md` - This documentation

## Potential Future Enhancements

- Store user's preferred timezone in database
- Add timezone selector UI for manual override
- Show workout times in user's current timezone vs creation timezone
- Add timezone info to workout detail view
