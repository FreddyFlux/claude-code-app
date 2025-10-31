import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  numeric,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Exercises Table - Reusable exercise library
export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    muscleGroup: varchar("muscle_group", { length: 100 }),
    equipmentType: varchar("equipment_type", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("exercises_user_id_idx").on(table.userId),
    index("exercises_muscle_group_idx").on(table.muscleGroup),
    index("exercises_equipment_type_idx").on(table.equipmentType),
  ]
);

// 2. Workout Templates Table - Reusable workout programs
export const workoutTemplates = pgTable(
  "workout_templates",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    muscleGroup: varchar("muscle_group", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("workout_templates_user_id_idx").on(table.userId),
    index("workout_templates_muscle_group_idx").on(table.muscleGroup),
  ]
);

// 3. Template Exercises Table - Junction table for templates and exercises
export const templateExercises = pgTable(
  "template_exercises",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id").notNull(),
    exerciseId: integer("exercise_id").notNull(),
    orderIndex: integer("order_index").notNull(),
    defaultSets: integer("default_sets"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [workoutTemplates.id],
      name: "template_exercises_template_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.exerciseId],
      foreignColumns: [exercises.id],
      name: "template_exercises_exercise_id_fk",
    }).onDelete("cascade"),
    index("template_exercises_template_id_idx").on(table.templateId),
    index("template_exercises_exercise_id_idx").on(table.exerciseId),
  ]
);

// 4. Workouts Table - Actual workout instances
export const workouts = pgTable(
  "workouts",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    templateId: integer("template_id"),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("in_progress"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [workoutTemplates.id],
      name: "workouts_template_id_fk",
    }).onDelete("set null"),
    index("workouts_user_id_idx").on(table.userId),
    index("workouts_template_id_idx").on(table.templateId),
    index("workouts_status_idx").on(table.status),
    index("workouts_started_at_idx").on(table.startedAt),
  ]
);

// 5. Workout Exercises Table - Exercises in a specific workout
export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id").notNull(),
    exerciseId: integer("exercise_id").notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.workoutId],
      foreignColumns: [workouts.id],
      name: "workout_exercises_workout_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.exerciseId],
      foreignColumns: [exercises.id],
      name: "workout_exercises_exercise_id_fk",
    }).onDelete("cascade"),
    index("workout_exercises_workout_id_idx").on(table.workoutId),
    index("workout_exercises_exercise_id_idx").on(table.exerciseId),
  ]
);

// 6. Sets Table - Individual sets with weight, reps, and rest time
export const sets = pgTable(
  "sets",
  {
    id: serial("id").primaryKey(),
    workoutExerciseId: integer("workout_exercise_id").notNull(),
    setNumber: integer("set_number").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    reps: integer("reps"),
    restSeconds: integer("rest_seconds"),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.workoutExerciseId],
      foreignColumns: [workoutExercises.id],
      name: "sets_workout_exercise_id_fk",
    }).onDelete("cascade"),
    index("sets_workout_exercise_id_idx").on(table.workoutExerciseId),
  ]
);

// Relations for type-safe queries

export const exercisesRelations = relations(exercises, ({ many }) => ({
  templateExercises: many(templateExercises),
  workoutExercises: many(workoutExercises),
}));

export const workoutTemplatesRelations = relations(
  workoutTemplates,
  ({ many }) => ({
    templateExercises: many(templateExercises),
    workouts: many(workouts),
  })
);

export const templateExercisesRelations = relations(
  templateExercises,
  ({ one }) => ({
    template: one(workoutTemplates, {
      fields: [templateExercises.templateId],
      references: [workoutTemplates.id],
    }),
    exercise: one(exercises, {
      fields: [templateExercises.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  template: one(workoutTemplates, {
    fields: [workouts.templateId],
    references: [workoutTemplates.id],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  })
);

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));
