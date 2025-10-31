CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"muscle_group" varchar(100),
	"equipment_type" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_exercise_id" integer NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" numeric(6, 2),
	"reps" integer,
	"rest_seconds" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"default_sets" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"muscle_group" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"template_id" integer,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_workout_exercise_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercises_user_id_idx" ON "exercises" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exercises_muscle_group_idx" ON "exercises" USING btree ("muscle_group");--> statement-breakpoint
CREATE INDEX "exercises_equipment_type_idx" ON "exercises" USING btree ("equipment_type");--> statement-breakpoint
CREATE INDEX "sets_workout_exercise_id_idx" ON "sets" USING btree ("workout_exercise_id");--> statement-breakpoint
CREATE INDEX "template_exercises_template_id_idx" ON "template_exercises" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_exercises_exercise_id_idx" ON "template_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "workout_exercises_workout_id_idx" ON "workout_exercises" USING btree ("workout_id");--> statement-breakpoint
CREATE INDEX "workout_exercises_exercise_id_idx" ON "workout_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "workout_templates_user_id_idx" ON "workout_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_templates_muscle_group_idx" ON "workout_templates" USING btree ("muscle_group");--> statement-breakpoint
CREATE INDEX "workouts_user_id_idx" ON "workouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workouts_template_id_idx" ON "workouts" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "workouts_status_idx" ON "workouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workouts_started_at_idx" ON "workouts" USING btree ("started_at");