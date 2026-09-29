"use client";

import { useEffect, useState } from "react";
import { createTask, deleteTask, fetchTasks, updateTask } from "@/lib/tasks/repository";
import { taskStatuses, type Task, type TaskStatus, type TaskUpdate } from "@/lib/tasks/types";
import { CircleAlert, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "./confirm-dialog";
import TaskCard from "./task-card";
import TaskForm from "./task-form";

// 列ごとのアクセントカラー
const statusStyles: Record<TaskStatus, { dot: string; border: string }> = {
  todo: { dot: "bg-slate-400", border: "border-slate-400" },
  in_progress: { dot: "bg-amber-500", border: "border-amber-500" },
  done: { dot: "bg-emerald-500", border: "border-emerald-500" },
};

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
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>新しいタスク</CardTitle>
          <CardDescription>追加したタスクは「未着手」に入ります</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm
            label="タスクを追加"
            submitLabel="追加"
            icon={<Plus />}
            resetOnSuccess
            onSubmit={handleCreate}
          />
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <p className="sr-only md:col-span-3">読み込み中…</p>
            {taskStatuses.map((status) => (
              <div key={status.value} className="flex flex-col gap-3 rounded-xl bg-muted p-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-16 w-full bg-background" />
                <Skeleton className="h-16 w-full bg-background" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {taskStatuses.map((status) => {
              const columnTasks = tasks.filter((task) => task.status === status.value);
              const headingId = `column-${status.value}`;
              return (
                <section
                  key={status.value}
                  aria-labelledby={headingId}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border-t-4 bg-muted p-3",
                    statusStyles[status.value].border,
                  )}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span
                      aria-hidden="true"
                      className={cn("size-2 rounded-full", statusStyles[status.value].dot)}
                    />
                    <h2 id={headingId} className="font-heading text-sm font-semibold">
                      {status.label}
                    </h2>
                    <Badge variant="secondary" className="ml-auto bg-background">
                      {columnTasks.length}件
                    </Badge>
                  </div>
                  {columnTasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-foreground/15 px-3 py-8 text-center text-sm text-muted-foreground">
                      タスクがありません
                    </p>
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
      </div>

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
