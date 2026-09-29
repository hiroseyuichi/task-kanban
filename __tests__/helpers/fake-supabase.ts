import type { Task } from "@/lib/tasks/types";

type Operation = "select" | "insert" | "update" | "delete";

type QueryResult = {
  data: Task | Task[] | null;
  error: { message: string } | null;
};

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;

export function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-0",
    title: "タスク",
    description: "",
    status: "todo",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// Supabase クライアントの tasks テーブル操作をインメモリで再現するフェイク
export function createFakeSupabase(initialRows: Task[] = []) {
  let rows = [...initialRows];
  const failures = new Set<Operation>();
  const calls: Operation[] = [];
  let sequence = 0;

  function execute(
    operation: Operation,
    payload: Partial<Task>,
    idFilter: string | null,
    single: boolean,
  ): QueryResult {
    calls.push(operation);
    if (failures.delete(operation)) {
      return { data: null, error: { message: `${operation} failed` } };
    }

    switch (operation) {
      case "select":
        return {
          data: [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at)),
          error: null,
        };
      case "insert": {
        sequence += 1;
        const timestamp = new Date(Date.UTC(2030, 0, 1, 0, 0, sequence)).toISOString();
        const created = buildTask({
          id: `new-task-${sequence}`,
          created_at: timestamp,
          updated_at: timestamp,
          ...payload,
        });
        rows = [...rows, created];
        return { data: single ? created : [created], error: null };
      }
      case "update": {
        const target = rows.find((row) => row.id === idFilter);
        if (!target) {
          return { data: null, error: { message: "not found" } };
        }
        const updated = { ...target, ...payload };
        rows = rows.map((row) => (row.id === idFilter ? updated : row));
        return { data: single ? updated : [updated], error: null };
      }
      case "delete":
        rows = rows.filter((row) => row.id !== idFilter);
        return { data: null, error: null };
    }
  }

  function from(table: string) {
    if (table !== "tasks") {
      throw new Error(`想定外のテーブル: ${table}`);
    }

    let operation: Operation | null = null;
    let payload: Partial<Task> = {};
    let idFilter: string | null = null;
    let single = false;

    const query = {
      select() {
        operation ??= "select";
        return query;
      },
      insert(values: Partial<Task>) {
        operation = "insert";
        payload = values;
        return query;
      },
      update(values: Partial<Task>) {
        operation = "update";
        payload = values;
        return query;
      },
      delete() {
        operation = "delete";
        return query;
      },
      eq(column: string, value: string) {
        if (column === "id") idFilter = value;
        return query;
      },
      order() {
        return query;
      },
      single() {
        single = true;
        return query;
      },
      then<TResult1 = QueryResult, TResult2 = never>(
        onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return Promise.resolve(
          execute(operation ?? "select", payload, idFilter, single),
        ).then(onfulfilled, onrejected);
      },
    };

    return query;
  }

  return {
    client: { from },
    get rows() {
      return rows;
    },
    calls,
    // 次の同種操作を1回だけ失敗させる
    failNext(operation: Operation) {
      failures.add(operation);
    },
  };
}
