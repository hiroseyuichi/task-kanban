import { describe, expect, test } from "vitest";
import { validateTaskInput } from "@/lib/tasks/validation";

describe("validateTaskInput", () => {
  test("タイトルと説明の前後の空白を取り除いた値で受理する", () => {
    expect(validateTaskInput({ title: "  買い物  ", description: " 牛乳 " })).toEqual({
      ok: true,
      value: { title: "買い物", description: "牛乳" },
    });
  });

  test("説明が空でも受理する", () => {
    expect(validateTaskInput({ title: "買い物", description: "" })).toEqual({
      ok: true,
      value: { title: "買い物", description: "" },
    });
  });

  test("タイトルが空のときは入力を求めるエラーになる", () => {
    expect(validateTaskInput({ title: "", description: "" })).toEqual({
      ok: false,
      message: "タイトルを入力してください",
    });
  });

  test("タイトルが空白だけのときは入力を求めるエラーになる", () => {
    expect(validateTaskInput({ title: "   ", description: "" })).toEqual({
      ok: false,
      message: "タイトルを入力してください",
    });
  });

  test("タイトルがちょうど100文字のときは受理する", () => {
    const result = validateTaskInput({ title: "あ".repeat(100), description: "" });
    expect(result.ok).toBe(true);
  });

  test("タイトルが101文字のときは文字数エラーになる", () => {
    expect(validateTaskInput({ title: "あ".repeat(101), description: "" })).toEqual({
      ok: false,
      message: "タイトルは100文字以内で入力してください",
    });
  });

  test("説明がちょうど1000文字のときは受理する", () => {
    const result = validateTaskInput({ title: "買い物", description: "あ".repeat(1000) });
    expect(result.ok).toBe(true);
  });

  test("説明が1001文字のときは文字数エラーになる", () => {
    expect(
      validateTaskInput({ title: "買い物", description: "あ".repeat(1001) }),
    ).toEqual({
      ok: false,
      message: "説明は1000文字以内で入力してください",
    });
  });
});
