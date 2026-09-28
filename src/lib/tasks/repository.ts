import { createClient } from "@/lib/supabase/client";
import type { Task, TaskInput, TaskUpdate } from "./types";

// Client Component から使う tasks テーブルの CRUD
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await createClient()
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error("タスクの取得に失敗しました");
  return data as Task[];
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data, error } = await createClient()
    .from("tasks")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error("タスクの追加に失敗しました");
  return data as Task;
}

export async function updateTask(id: string, input: TaskUpdate): Promise<Task> {
  const { data, error } = await createClient()
    .from("tasks")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error("タスクの更新に失敗しました");
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await createClient().from("tasks").delete().eq("id", id);

  if (error) throw new Error("タスクの削除に失敗しました");
}
