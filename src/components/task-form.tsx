"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { taskStatuses, type TaskStatus, type TaskUpdate } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type TaskFormProps = {
  label: string;
  submitLabel: string;
  // 送信ボタンのラベル前に表示するアイコン
  icon?: ReactNode;
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
  icon,
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
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-title`}>タイトル</Label>
        <Input
          id={`${id}-title`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例: 企画書を作る"
          aria-invalid={error ? true : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-description`}>説明</Label>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="詳細やメモ（任意）"
          rows={2}
        />
      </div>

      {showStatus && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-status`}>ステータス</Label>
          <NativeSelect
            id={`${id}-status`}
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className="w-full"
          >
            {taskStatuses.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {icon}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
