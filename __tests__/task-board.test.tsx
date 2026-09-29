import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import TaskBoard from "@/components/task-board";
import { buildTask, createFakeSupabase, type FakeSupabase } from "./helpers/fake-supabase";

// 外部依存である Supabase クライアントだけをフェイクに差し替える
const supabase = vi.hoisted(() => ({ current: null as FakeSupabase | null }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => supabase.current?.client,
}));

let fake: FakeSupabase;

beforeEach(() => {
  fake = createFakeSupabase([
    buildTask({ id: "t1", title: "買い物", description: "牛乳を買う", status: "todo" }),
    buildTask({
      id: "t2",
      title: "資料作成",
      status: "in_progress",
      created_at: "2026-01-02T00:00:00.000Z",
    }),
  ]);
  supabase.current = fake;
});

afterEach(() => {
  cleanup();
});

function column(label: string) {
  return screen.getByRole("region", { name: label });
}

async function renderBoard() {
  render(<TaskBoard />);
  await screen.findByText("買い物");
}

function addForm() {
  return screen.getByRole("form", { name: "タスクを追加" });
}

function editForm() {
  return screen.getByRole("form", { name: "タスクを編集" });
}

describe("一覧表示", () => {
  test("取得したタスクがステータスごとの列に表示される", async () => {
    await renderBoard();

    expect(within(column("未着手")).getByText("買い物")).toBeDefined();
    expect(within(column("未着手")).getByText("牛乳を買う")).toBeDefined();
    expect(within(column("進行中")).getByText("資料作成")).toBeDefined();
    expect(within(column("完了")).getByText("タスクがありません")).toBeDefined();
  });

  test("タスクが0件のときは全列に「タスクがありません」と表示される", async () => {
    supabase.current = createFakeSupabase([]);
    render(<TaskBoard />);

    expect(await screen.findAllByText("タスクがありません")).toHaveLength(3);
  });

  test("取得に失敗したときはエラーメッセージが表示される", async () => {
    fake.failNext("select");
    render(<TaskBoard />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "タスクの取得に失敗しました",
    );
  });
});

describe("追加", () => {
  test("タイトルを入力して追加すると、すぐに未着手の列に表示され入力欄が空になる", async () => {
    await renderBoard();
    const form = addForm();

    fireEvent.change(within(form).getByLabelText("タイトル"), {
      target: { value: "掃除" },
    });
    fireEvent.change(within(form).getByLabelText("説明"), {
      target: { value: "部屋を片付ける" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "追加" }));

    expect(await within(column("未着手")).findByText("掃除")).toBeDefined();
    expect(within(column("未着手")).getByText("部屋を片付ける")).toBeDefined();
    expect((within(form).getByLabelText("タイトル") as HTMLInputElement).value).toBe("");
    expect((within(form).getByLabelText("説明") as HTMLTextAreaElement).value).toBe("");
  });

  test("タイトルが空のまま追加するとエラーが表示され、保存されない", async () => {
    await renderBoard();

    fireEvent.click(within(addForm()).getByRole("button", { name: "追加" }));

    expect(within(addForm()).getByRole("alert").textContent).toBe(
      "タイトルを入力してください",
    );
    expect(fake.calls).not.toContain("insert");
  });

  test("保存に失敗したときはエラーが表示され、一覧は変わらず入力内容も残る", async () => {
    await renderBoard();
    fake.failNext("insert");
    const form = addForm();

    fireEvent.change(within(form).getByLabelText("タイトル"), {
      target: { value: "掃除" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "追加" }));

    expect((await screen.findByText("タスクの追加に失敗しました"))).toBeDefined();
    expect(screen.queryByText("掃除", { selector: "h3" })).toBeNull();
    expect((within(form).getByLabelText("タイトル") as HTMLInputElement).value).toBe("掃除");
  });
});

describe("編集", () => {
  test("編集ボタンで編集フォームが開き、キャンセルで元の表示に戻る", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    expect((within(editForm()).getByLabelText("タイトル") as HTMLInputElement).value).toBe(
      "買い物",
    );

    fireEvent.click(within(editForm()).getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("form", { name: "タスクを編集" })).toBeNull();
    expect(within(column("未着手")).getByText("買い物")).toBeDefined();
  });

  test("タイトルとステータスを変更して保存すると、すぐに移動先の列に反映される", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    const form = editForm();
    fireEvent.change(within(form).getByLabelText("タイトル"), {
      target: { value: "買い物（済）" },
    });
    fireEvent.change(within(form).getByLabelText("ステータス"), {
      target: { value: "done" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "保存" }));

    expect(await within(column("完了")).findByText("買い物（済）")).toBeDefined();
    expect(within(column("未着手")).queryByText("買い物")).toBeNull();
    expect(screen.queryByRole("form", { name: "タスクを編集" })).toBeNull();
  });

  test("完了にしたタスクを未着手に戻すと、元の列に表示される", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「資料作成」を編集" }));
    fireEvent.change(within(editForm()).getByLabelText("ステータス"), {
      target: { value: "done" },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));
    await within(column("完了")).findByText("資料作成");

    fireEvent.click(screen.getByRole("button", { name: "「資料作成」を編集" }));
    fireEvent.change(within(editForm()).getByLabelText("ステータス"), {
      target: { value: "todo" },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));

    expect(await within(column("未着手")).findByText("資料作成")).toBeDefined();
    expect(within(column("完了")).queryByText("資料作成")).toBeNull();
  });

  test("タイトルを空にして保存するとエラーが表示され、保存されない", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    fireEvent.change(within(editForm()).getByLabelText("タイトル"), {
      target: { value: " " },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));

    expect(within(editForm()).getByRole("alert").textContent).toBe(
      "タイトルを入力してください",
    );
    expect(fake.calls).not.toContain("update");
  });

  test("更新に失敗したときはエラーが表示され、編集フォームが開いたままになる", async () => {
    await renderBoard();
    fake.failNext("update");

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    fireEvent.change(within(editForm()).getByLabelText("タイトル"), {
      target: { value: "買い物（済）" },
    });
    fireEvent.click(within(editForm()).getByRole("button", { name: "保存" }));

    expect(await screen.findByText("タスクの更新に失敗しました")).toBeDefined();
    expect(editForm()).toBeDefined();
  });
});

describe("削除", () => {
  test("削除ボタンを押すと確認ダイアログが表示され、まだ削除されない", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を削除" }));

    const dialog = screen.getByRole("dialog", { name: "タスクを削除しますか？" });
    expect(within(dialog).getByText(/「買い物」を削除します/)).toBeDefined();
    expect(fake.calls).not.toContain("delete");
  });

  test("確認ダイアログで「削除する」を押すと、すぐに一覧から消える", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    await vi.waitFor(() => {
      expect(screen.queryByText("買い物")).toBeNull();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(column("進行中")).getByText("資料作成")).toBeDefined();
  });

  test("確認ダイアログで「キャンセル」を押すとダイアログが閉じ、タスクは残る", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を削除" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "キャンセル" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(column("未着手")).getByText("買い物")).toBeDefined();
    expect(fake.calls).not.toContain("delete");
  });

  test("確認ダイアログは Escape キーでも閉じられる", async () => {
    await renderBoard();

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を削除" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(column("未着手")).getByText("買い物")).toBeDefined();
  });

  test("削除に失敗したときはエラーが表示され、タスクは残る", async () => {
    await renderBoard();
    fake.failNext("delete");

    fireEvent.click(screen.getByRole("button", { name: "「買い物」を削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    expect(await screen.findByText("タスクの削除に失敗しました")).toBeDefined();
    expect(within(column("未着手")).getByText("買い物")).toBeDefined();
  });
});
