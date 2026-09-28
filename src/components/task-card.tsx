"use client";

import { useState } from "react";
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
      <li className="rounded-lg border border-blue-300 bg-white p-3 shadow-sm dark:border-blue-700 dark:bg-zinc-900">
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
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-medium break-words">{task.title}</h3>
      {task.description && (
        <p className="text-sm whitespace-pre-wrap break-words text-zinc-600 dark:text-zinc-400">
          {task.description}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          aria-label={`「${task.title}」を編集`}
          onClick={() => setEditing(true)}
          className="rounded border border-zinc-300 px-2 py-0.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          編集
        </button>
        <button
          type="button"
          aria-label={`「${task.title}」を削除`}
          onClick={() => onRequestDelete(task)}
          className="rounded border border-red-300 px-2 py-0.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
        >
          削除
        </button>
      </div>
    </li>
  );
}
