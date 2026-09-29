// 看板の列の並び順と表示名
export const taskStatuses = [
  { value: "todo", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "done", label: "完了" },
] as const;

export type TaskStatus = (typeof taskStatuses)[number]["value"];

// public.tasks テーブルの1行
export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  description: string;
};

export type TaskUpdate = TaskInput & {
  status: TaskStatus;
};
