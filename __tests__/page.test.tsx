import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Page from "@/app/page";
import { createFakeSupabase } from "./helpers/fake-supabase";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createFakeSupabase([]).client,
}));

afterEach(() => {
  cleanup();
});

test("トップページに見出しが表示される", async () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "タスク看板" }),
  ).toBeDefined();
  await screen.findAllByText("タスクがありません");
});
