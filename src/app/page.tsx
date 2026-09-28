import TaskBoard from "@/components/task-board";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          タスク看板
        </h1>
        <TaskBoard />
      </main>
    </div>
  );
}
