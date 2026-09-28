"use client";

import { useEffect, useState } from "react";
import { createTask, deleteTask, fetchTasks, updateTask } from "@/lib/tasks/repository";
import { taskStatuses, type Task, type TaskUpdate } from "@/lib/tasks/types";
import ConfirmDialog from "./confirm-dialog";
import TaskCard from "./task-card";
import TaskForm from "./task-form";

// タスク看板本体。追加・更新・削除の結果は再取得せず state に直接反映する
export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchTasks()
      .then((rows) => {
        if (!ignore) setTasks(rows);
      })
      .catch((fetchError: unknown) => {
        if (!ignore) setError(toMessage(fetchError));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleCreate(values: TaskUpdate) {
    const created = await createTask({ title: values.title, description: values.description });
    setTasks((current) => [...current, created]);
  }

  async function handleUpdate(id: string, values: TaskUpdate) {
    const updated = await updateTask(id, values);
    setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      await deleteTask(target.id);
      setTasks((current) => current.filter((task) => task.id !== target.id));
      setError(null);
    } catch (deleteError) {
      setError(toMessage(deleteError));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="max-w-md rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <TaskForm label="タスクを追加" submitLabel="追加" resetOnSuccess onSubmit={handleCreate} />
      </section>

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {taskStatuses.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status.value);
            const headingId = `column-${status.value}`;
            return (
              <section
                key={status.value}
                aria-labelledby={headingId}
                className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800"
              >
                <div className="flex items-baseline gap-2">
                  <h2 id={headingId} className="font-semibold">
                    {status.label}
                  </h2>
                  <span className="text-sm text-zinc-500">{columnTasks.length}件</span>
                </div>
                {columnTasks.length === 0 ? (
                  <p className="text-sm text-zinc-500">タスクがありません</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={handleUpdate}
                        onRequestDelete={setDeleteTarget}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="タスクを削除しますか？"
          message={`「${deleteTarget.title}」を削除します。この操作は取り消せません。`}
          confirmLabel="削除する"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
