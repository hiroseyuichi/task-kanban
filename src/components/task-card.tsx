"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, TaskUpdate } from "@/lib/tasks/types";
import TaskForm from "./task-form";

type TaskCardProps = {
  task: Task;
  onUpdate: (id: string, values: TaskUpdate) => Promise<void>;
  onRequestDelete: (task: Task) => void;
};

// 表示モードと編集モードを切り替えるタスクカード
export default function TaskCard({ task, onUpdate, onRequestDelete }: TaskCardProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl bg-card p-3 text-card-foreground shadow-sm ring-2 ring-primary/60">
        <TaskForm
          label="タスクを編集"
          submitLabel="保存"
          initialValues={task}
          showStatus
          onSubmit={async (values) => {
            await onUpdate(task.id, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="group/task flex items-start gap-2 rounded-xl bg-card p-3 text-card-foreground shadow-xs ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-sm font-medium break-words">{task.title}</h3>
        {task.description && (
          <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-0.5 opacity-60 transition-opacity group-hover/task:opacity-100 focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`「${task.title}」を編集`}
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`「${task.title}」を削除`}
          onClick={() => onRequestDelete(task)}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
