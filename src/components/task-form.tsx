"use client";

import { useId, useState, type FormEvent } from "react";
import { taskStatuses, type TaskStatus, type TaskUpdate } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";

type TaskFormProps = {
  label: string;
  submitLabel: string;
  initialValues?: TaskUpdate;
  showStatus?: boolean;
  resetOnSuccess?: boolean;
  // 失敗時は Error を throw する。メッセージはフォーム内に表示される
  onSubmit: (values: TaskUpdate) => Promise<void>;
  onCancel?: () => void;
};

const emptyValues: TaskUpdate = { title: "", description: "", status: "todo" };

// タスクの追加・編集で共用するフォーム
export default function TaskForm({
  label,
  submitLabel,
  initialValues = emptyValues,
  showStatus = false,
  resetOnSuccess = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const id = useId();
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [status, setStatus] = useState<TaskStatus>(initialValues.status);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = validateTaskInput({ title, description });
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ ...result.value, status });
      if (resetOnSuccess) {
        setTitle("");
        setDescription("");
        setSubmitting(false);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
      setSubmitting(false);
    }
  }

  return (
    <form
      aria-label={label}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-2"
    >
      <label htmlFor={`${id}-title`} className="text-sm font-medium">
        タイトル
      </label>
      <input
        id={`${id}-title`}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
      />

      <label htmlFor={`${id}-description`} className="text-sm font-medium">
        説明
      </label>
      <textarea
        id={`${id}-description`}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={2}
        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
      />

      {showStatus && (
        <>
          <label htmlFor={`${id}-status`} className="text-sm font-medium">
            ステータス
          </label>
          <select
            id={`${id}-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
          >
            {taskStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
