import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { todos } from '@/db/schema'
import { z } from 'zod'
import { desc, asc, eq, not, between, sql } from 'drizzle-orm'

// Q: When should I invalidate the query?
const Query = createServerFn({ method: 'GET' }).handler(() => {
  return db.query.todos.findMany({
    orderBy: [asc(todos.rank)],
  })
})

const AddTodoInputSchema = z.object({
  name: z.string(),
  rank: z.int(),
})

const Add = createServerFn({ method: 'POST' })
  .inputValidator(AddTodoInputSchema)
  .handler(async ({ data }) => {
    await db.insert(todos).values({
      name: data.name,
      isComplete: false,
      rank: data.rank,
    })
  })

const UpdateTodoSchema = z.object({
  id: z.uuid(),
  isComplete: z.boolean(),
})

const Update = createServerFn({ method: 'POST' })
  .inputValidator(UpdateTodoSchema)
  .handler(async ({ data }) => {
    await db
      .update(todos)
      .set({ isComplete: not(todos.isComplete) })
      .where(eq(todos.id, data.id))
  })

const UpdateRankTodoSchema = z.object({
  dragged_id: z.uuid(),
  old_rank: z.int(),
  dragged_over_id: z.uuid(),
  new_rank: z.int(),
})

const UpdateRank = createServerFn({ method: 'POST' })
  .inputValidator(UpdateRankTodoSchema)
  .handler(async ({ data }) => {
    const gt = data.old_rank > data.new_rank
    const op = gt ? sql`${todos.rank} + 1` : sql`${todos.rank} - 1`
    await db
      .update(todos)
      .set({ rank: op })
      .where(
        gt
          ? between(todos.rank, data.new_rank, data.old_rank - 1)
          : between(todos.rank, data.old_rank + 1, data.new_rank),
      )
    await db
      .update(todos)
      .set({ rank: data.new_rank })
      .where(eq(todos.id, data.dragged_id))
    return 1
  })

export { Add, Query, Update, UpdateRank }
