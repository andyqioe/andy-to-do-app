CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"rank" integer NOT NULL,
	"name" text NOT NULL,
	"isComplete" boolean NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
