import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { existsSync } from "fs";

// Load environment variables from .env.local or .env
if (existsSync(".env.local")) {
  config({ path: ".env.local" });
} else if (existsSync(".env")) {
  config({ path: ".env" });
}

/**
 * Seed script to insert test workout data
 * Usage: npx tsx scripts/seed-test-data.ts <YOUR_CLERK_USER_ID>
 */

async function seedTestData() {
  const userId = process.argv[2];

  if (!userId) {
    console.error("❌ Error: Please provide your Clerk user ID as an argument");
    console.log("\nUsage: npx tsx scripts/seed-test-data.ts <YOUR_CLERK_USER_ID>");
    console.log("\nTo find your Clerk user ID:");
    console.log("1. Run your app with 'npm run dev'");
    console.log("2. Check the console logs when you visit /dashboard");
    console.log("3. Look for: [DashboardPage] User ID: user_xxxxx");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL environment variable not set");
    console.error("Make sure you have a .env.local file with DATABASE_URL");
    process.exit(1);
  }

  console.log("🌱 Seeding test workout data...\n");
  console.log(`User ID: ${userId}`);

  const sql = neon(databaseUrl);

  try {
    // 1. Insert exercise
    console.log("1. Inserting exercise...");
    await sql`
      INSERT INTO exercises (user_id, name, description, muscle_group, equipment_type)
      VALUES (
        ${userId},
        'Bench Press',
        'Chest exercise with barbell',
        'Chest',
        'Barbell'
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;

    // Get the exercise ID
    const exerciseResult = await sql`
      SELECT id FROM exercises
      WHERE user_id = ${userId} AND name = 'Bench Press'
      LIMIT 1
    `;
    const exerciseId = exerciseResult[0]?.id;

    if (!exerciseId) {
      throw new Error("Failed to create or find exercise");
    }
    console.log(`   ✅ Exercise created with ID: ${exerciseId}`);

    // 2. Insert workout for October 28, 2025
    console.log("2. Inserting workout for October 28, 2025...");
    const workoutResult = await sql`
      INSERT INTO workouts (
        user_id,
        name,
        status,
        started_at,
        completed_at,
        duration_seconds
      )
      VALUES (
        ${userId},
        'Morning Chest Workout',
        'completed',
        '2025-10-28 09:30:00+00'::timestamptz,
        '2025-10-28 10:15:00+00'::timestamptz,
        2700
      )
      RETURNING id
    `;
    const workoutId = workoutResult[0]?.id;
    console.log(`   ✅ Workout created with ID: ${workoutId}`);

    // 3. Link exercise to workout
    console.log("3. Linking exercise to workout...");
    const workoutExerciseResult = await sql`
      INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
      VALUES (${workoutId}, ${exerciseId}, 1)
      RETURNING id
    `;
    const workoutExerciseId = workoutExerciseResult[0]?.id;
    console.log(`   ✅ Workout exercise created with ID: ${workoutExerciseId}`);

    // 4. Add sets
    console.log("4. Adding sets...");
    await sql`
      INSERT INTO sets (workout_exercise_id, set_number, weight_kg, reps, rest_seconds, completed)
      VALUES
        (${workoutExerciseId}, 1, 60.0, 12, 90, true),
        (${workoutExerciseId}, 2, 60.0, 10, 90, true),
        (${workoutExerciseId}, 3, 60.0, 8, 90, true)
    `;
    console.log("   ✅ 3 sets added");

    // 5. Verify the data
    console.log("\n5. Verifying data...");
    const verification = await sql`
      SELECT
        w.id as workout_id,
        w.name as workout_name,
        w.started_at,
        COUNT(DISTINCT we.id) as exercise_count,
        COUNT(s.id) as set_count
      FROM workouts w
      LEFT JOIN workout_exercises we ON w.id = we.workout_id
      LEFT JOIN sets s ON we.id = s.workout_exercise_id
      WHERE w.id = ${workoutId}
      GROUP BY w.id, w.name, w.started_at
    `;

    console.log("\n✅ Test data seeded successfully!");
    console.log("\nWorkout details:");
    console.log(`   ID: ${verification[0].workout_id}`);
    console.log(`   Name: ${verification[0].workout_name}`);
    console.log(`   Started At: ${verification[0].started_at}`);
    console.log(`   Exercises: ${verification[0].exercise_count}`);
    console.log(`   Sets: ${verification[0].set_count}`);

    console.log("\n📅 To view this workout:");
    console.log("   1. Start your dev server: npm run dev");
    console.log("   2. Navigate to /dashboard");
    console.log("   3. Select October 28, 2025 in the calendar");
    console.log("   4. You should see 'Morning Chest Workout'");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedTestData();
