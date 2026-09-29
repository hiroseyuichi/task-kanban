import { KanbanSquare } from "lucide-react";
import TaskBoard from "@/components/task-board";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-muted/40 font-sans">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <KanbanSquare className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight">タスク看板</h1>
            <p className="text-sm text-muted-foreground">
              未着手・進行中・完了の3列でタスクを管理します
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8">
        <TaskBoard />
      </main>
    </div>
  );
}
