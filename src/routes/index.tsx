import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Album, GripVertical, NotebookTabs, Ellipsis } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Add, Query, Update, UpdateRank } from '@/lib/server_functions'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export const Route = createFileRoute('/')({
  component: App,
  loader: () => {
    return Query()
  },
})

function App() {
  const state = Route.useLoaderData()
  return (
    <div className="min-h-screen max-w-screen y-gap-6">
      <h1 className="py-5 flex text-center justify-center">
        <NotebookTabs size={64} />
      </h1>
      <div className="flex text-center justify-center min-h-screen y-gap-6">
        <div className="flex justify-between gap-4">
          <TodoList todos={state} />
        </div>
      </div>
    </div>
  )
}

function TodoList({
  todos,
}: {
  todos: Array<{
    id: string
    name: string
    isComplete: boolean
    createdAt: Date
  }>
}) {
  const [todosLocal, setTodos] = useState(todos)
  const isEmpty = todos.length === 0
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const invalidateQueries = () => {
    router.invalidate()
  }
  // 1. UseEffect - use when we need to sync with external systems (DOM manip, browser APIs (event listeners, timers, localStorage))
  // WebSockets, 3rd party libraries
  useEffect(() => {
    // 2. Create the handle function
    const handleKeyPress = async (_: KeyboardEvent) => {
      if (
        !(
          inputRef.current !== null &&
          inputRef.current === document.activeElement
        )
      ) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  })
  useEffect(() => {
    setTodos(todos)
  }, [todos])

  const todoIds = todosLocal.map((e) => e.id)
  const sensors = useSensors(useSensor(PointerSensor))
  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = todosLocal.findIndex((i) => i.id === active.id)
    const newIndex = todosLocal.findIndex((i) => i.id === over.id)
    const oldState = todosLocal
    setTodos(arrayMove(todosLocal, oldIndex, newIndex))
    try {
      await UpdateRank({
        data: {
          dragged_id: active.id.toString(),
          old_rank: oldIndex,
          dragged_over_id: over.id.toString(),
          new_rank: newIndex,
        },
      })
    } catch (e) {
      setTodos(oldState)
      throw e
    }
    invalidateQueries()
  }
  return (
    <div>
      <Empty className="p-4! border border-white/10 min-w-lg bg-white/5 backdrop-blur-sm rounded-xl shadow-lg shadow-black/20">
        {isEmpty ? (
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Album />
            </EmptyMedia>
            <EmptyTitle>You have no to-do items</EmptyTitle>
            <EmptyDescription>Type anything to start adding!</EmptyDescription>
          </EmptyHeader>
        ) : (
          <DndContext
            id="todo-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={todoIds}
              strategy={verticalListSortingStrategy}
            >
              {todosLocal.map((e) => (
                <TodoItem
                  key={e.id}
                  data={{
                    id: e.id,
                    inputStr: e.name,
                    isComplete: e.isComplete,
                    invalidate: invalidateQueries,
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </Empty>
      <EmptyContent className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Field>
          <Input
            className="backdrop-blur-md"
            id="taskname"
            name="task"
            required
            placeholder="clean kitchen... "
            onKeyDown={async (e) => {
              if (
                e.key === 'Enter' &&
                e.currentTarget !== null &&
                e.currentTarget.value
              ) {
                await Add({
                  data: { name: e.currentTarget?.value, rank: todos.length },
                })
                invalidateQueries()
              }
            }}
            ref={inputRef}
          />
        </Field>
      </EmptyContent>
    </div>
  )
}

function TodoItem({
  data,
}: {
  data: {
    id: string
    inputStr: string
    isComplete: boolean
    invalidate: () => void
  }
}) {
  const handleOnCheckedChange = async () => {
    await Update({ data: { id: data.id, isComplete: data.isComplete } })
    data.invalidate()
  }
  const [isEditing, setEditingState] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: data.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center py-2 text-xs w-full h-full ${isDragging ? 'z-10 opacity-50 shadow-md' : ''}`}
    >
      {/* ...listener props passes all the event handler props*/}
      <div {...listeners} className="cursor-grab px-1">
        <GripVertical size={14} />
      </div>
      <Ellipsis className="opacity-20 scale-50" />
      <Checkbox
        className="mx-4"
        checked={data.isComplete}
        onCheckedChange={handleOnCheckedChange}
      />

      <span
        className={data.isComplete ? 'line-through text-muted-foreground' : ''}
        onClick={() => setEditingState(!isEditing)}
      >
        {isEditing ? <Input></Input> : data.inputStr}
      </span>
    </div>
  )
}
