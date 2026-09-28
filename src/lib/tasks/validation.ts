import type { TaskInput } from "./types";

// DB の check 制約と揃えること
const maxTitleLength = 100;
const maxDescriptionLength = 1000;

export type TaskValidationResult =
  | { ok: true; value: TaskInput }
  | { ok: false; message: string };

export function validateTaskInput(input: TaskInput): TaskValidationResult {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length === 0) {
    return { ok: false, message: "タイトルを入力してください" };
  }
  if (title.length > maxTitleLength) {
    return { ok: false, message: `タイトルは${maxTitleLength}文字以内で入力してください` };
  }
  if (description.length > maxDescriptionLength) {
    return { ok: false, message: `説明は${maxDescriptionLength}文字以内で入力してください` };
  }

  return { ok: true, value: { title, description } };
}
