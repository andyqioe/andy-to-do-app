import {
  timestamp,
  pgTable,
  integer,
  uuid,
  text,
  boolean,
} from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  rank: integer('rank').notNull(),
  name: text('name').notNull(),
  isComplete: boolean().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})
