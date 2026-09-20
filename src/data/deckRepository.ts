import Database from "@tauri-apps/plugin-sql";
import type { CreateGoalInput, CreateProgressItemInput, CreateTaskInput, Goal, GoalStatus, ProgressItem, ProgressItemStatus, Task, TaskDetails, TaskStatus, TaskWithGoal } from "../types/deck";

const DATABASE_PATH = "sqlite:commanddeck.db";
const RECENT_DONE_LIMIT = 12;
let databasePromise: Promise<Database> | undefined;

type GoalRow = { id: string; title: string; status: GoalStatus; created_at: string; updated_at: string };
type TaskRow = {
  id: string; goal_id: string | null; title: string; status: TaskStatus; current_summary: string | null; next_action: string | null;
  created_at: string; updated_at: string; completed_at: string | null; goal_title?: string | null; goal_status?: GoalStatus | null;
  goal_created_at?: string | null; goal_updated_at?: string | null;
};
type ProgressItemRow = { id: string; task_id: string; content: string; status: ProgressItemStatus; sort_order: number; created_at: string; updated_at: string };

const taskSelect = `SELECT tasks.id, tasks.goal_id, tasks.title, tasks.status, tasks.current_summary,
  tasks.next_action, tasks.created_at, tasks.updated_at, tasks.completed_at, goals.title AS goal_title,
  goals.status AS goal_status, goals.created_at AS goal_created_at, goals.updated_at AS goal_updated_at
  FROM tasks LEFT JOIN goals ON goals.id = tasks.goal_id`;

const toGoal = (row: GoalRow): Goal => ({ id: row.id, title: row.title, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at });
const toTask = (row: TaskRow): Task => ({
  id: row.id, goalId: row.goal_id, title: row.title, status: row.status, currentSummary: row.current_summary,
  nextAction: row.next_action, createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at,
});
const toProgressItem = (row: ProgressItemRow): ProgressItem => ({
  id: row.id, taskId: row.task_id, content: row.content, status: row.status, sortOrder: row.sort_order,
  createdAt: row.created_at, updatedAt: row.updated_at,
});
const toTaskWithGoal = (row: TaskRow): TaskWithGoal => ({
  task: toTask(row),
  goal: row.goal_id && row.goal_title && row.goal_status && row.goal_created_at && row.goal_updated_at
    ? { id: row.goal_id, title: row.goal_title, status: row.goal_status, createdAt: row.goal_created_at, updatedAt: row.goal_updated_at }
    : null,
});
const timestamp = () => new Date().toISOString();
const newId = () => crypto.randomUUID();
async function getDatabase(): Promise<Database> { databasePromise ??= Database.load(DATABASE_PATH); return databasePromise; }

async function listProgressItemsForTask(taskId: string): Promise<ProgressItem[]> {
  const rows = await (await getDatabase()).select<ProgressItemRow[]>(
    "SELECT id, task_id, content, status, sort_order, created_at, updated_at FROM progress_items WHERE task_id = $1 ORDER BY sort_order ASC, created_at ASC", [taskId]);
  return rows.map(toProgressItem);
}

export async function listActiveGoals(): Promise<Goal[]> {
  const rows = await (await getDatabase()).select<GoalRow[]>(
    "SELECT id, title, status, created_at, updated_at FROM goals WHERE status = $1 ORDER BY updated_at DESC", ["active"]);
  return rows.map(toGoal);
}
export async function listAllGoals(): Promise<Goal[]> {
  const rows = await (await getDatabase()).select<GoalRow[]>(
    "SELECT id, title, status, created_at, updated_at FROM goals ORDER BY updated_at DESC");
  return rows.map(toGoal);
}
export async function listSelectableGoals(): Promise<Goal[]> {
  const rows = await (await getDatabase()).select<GoalRow[]>(
    "SELECT id, title, status, created_at, updated_at FROM goals WHERE status IN ($1, $2) ORDER BY updated_at DESC", ["active", "future"]);
  return rows.map(toGoal);
}

export async function listNowTasks(): Promise<TaskDetails[]> {
  const rows = await (await getDatabase()).select<TaskRow[]>(`${taskSelect} WHERE tasks.status = $1 ORDER BY tasks.updated_at DESC`, ["active"]);
  return Promise.all(rows.map(async (row) => ({ ...toTaskWithGoal(row), progressItems: await listProgressItemsForTask(row.id) })));
}

async function listTasksByStatus(status: TaskStatus): Promise<TaskWithGoal[]> {
  const rows = await (await getDatabase()).select<TaskRow[]>(`${taskSelect} WHERE tasks.status = $1 ORDER BY tasks.updated_at DESC`, [status]);
  return rows.map(toTaskWithGoal);
}
export const listNextTasks = () => listTasksByStatus("future");
export async function listRecentDoneTasks(): Promise<TaskWithGoal[]> {
  const rows = await (await getDatabase()).select<TaskRow[]>(`${taskSelect} WHERE tasks.status = $1 ORDER BY tasks.completed_at DESC LIMIT $2`, ["completed", RECENT_DONE_LIMIT]);
  return rows.map(toTaskWithGoal);
}
export async function getTaskDetails(taskId: string): Promise<TaskDetails | null> {
  const rows = await (await getDatabase()).select<TaskRow[]>(`${taskSelect} WHERE tasks.id = $1`, [taskId]);
  return rows[0] ? { ...toTaskWithGoal(rows[0]), progressItems: await listProgressItemsForTask(taskId) } : null;
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const createdAt = timestamp(); const goal: Goal = { id: newId(), title: input.title, status: input.status ?? "future", createdAt, updatedAt: createdAt };
  await (await getDatabase()).execute("INSERT INTO goals (id, title, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)", [goal.id, goal.title, goal.status, goal.createdAt, goal.updatedAt]);
  return goal;
}
export async function updateGoal(id: string, title: string): Promise<void> {
  await (await getDatabase()).execute("UPDATE goals SET title = $1, updated_at = $2 WHERE id = $3", [title, timestamp(), id]);
}
export async function changeGoalStatus(id: string, status: GoalStatus): Promise<void> {
  await (await getDatabase()).execute("UPDATE goals SET status = $1, updated_at = $2 WHERE id = $3", [status, timestamp(), id]);
}
export async function countOpenTasksForGoal(goalId: string): Promise<number> {
  const rows = await (await getDatabase()).select<Array<{ task_count: number }>>(
    "SELECT COUNT(*) AS task_count FROM tasks WHERE goal_id = $1 AND status IN ($2, $3)",
    [goalId, "active", "future"],
  );
  return Number(rows[0]?.task_count ?? 0);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const createdAt = timestamp(); const status = input.status ?? "future";
  const task: Task = { id: newId(), goalId: input.goalId ?? null, title: input.title, status, currentSummary: input.currentSummary ?? null, nextAction: input.nextAction ?? null, createdAt, updatedAt: createdAt, completedAt: status === "completed" ? createdAt : null };
  await (await getDatabase()).execute("INSERT INTO tasks (id, goal_id, title, status, current_summary, next_action, created_at, updated_at, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [task.id, task.goalId, task.title, task.status, task.currentSummary, task.nextAction, task.createdAt, task.updatedAt, task.completedAt]);
  return task;
}
export async function updateTask(id: string, updates: Pick<CreateTaskInput, "title" | "goalId" | "currentSummary" | "nextAction">): Promise<void> {
  await (await getDatabase()).execute("UPDATE tasks SET title = $1, goal_id = $2, current_summary = $3, next_action = $4, updated_at = $5 WHERE id = $6", [updates.title, updates.goalId ?? null, updates.currentSummary ?? null, updates.nextAction ?? null, timestamp(), id]);
}
export async function changeTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const updatedAt = timestamp();
  await (await getDatabase()).execute("UPDATE tasks SET status = $1, completed_at = $2, updated_at = $3 WHERE id = $4", [status, status === "completed" ? updatedAt : null, updatedAt, id]);
}

export async function createProgressItem(input: CreateProgressItemInput): Promise<ProgressItem> {
  const createdAt = timestamp(); const sortOrder = input.sortOrder ?? (await listProgressItemsForTask(input.taskId)).length;
  const item: ProgressItem = { id: newId(), taskId: input.taskId, content: input.content, status: input.status ?? "future", sortOrder, createdAt, updatedAt: createdAt };
  await (await getDatabase()).execute("INSERT INTO progress_items (id, task_id, content, status, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)", [item.id, item.taskId, item.content, item.status, item.sortOrder, item.createdAt, item.updatedAt]);
  return item;
}
export async function updateProgressItem(id: string, updates: Pick<ProgressItem, "content" | "status">): Promise<void> {
  await (await getDatabase()).execute("UPDATE progress_items SET content = $1, status = $2, updated_at = $3 WHERE id = $4", [updates.content, updates.status, timestamp(), id]);
}
export async function deleteProgressItem(id: string): Promise<void> { await (await getDatabase()).execute("DELETE FROM progress_items WHERE id = $1", [id]); }
export async function reorderProgressItems(taskId: string, orderedIds: string[]): Promise<void> {
  if (!orderedIds.length) return;
  const items = await listProgressItemsForTask(taskId);
  if (items.length !== orderedIds.length || items.some((item) => !orderedIds.includes(item.id)) || new Set(orderedIds).size !== orderedIds.length) throw new Error("Progress item reorder must include every item for the task exactly once.");
  const branches = orderedIds.map((_, index) => `WHEN $${index + 2} THEN ${index}`).join(" ");
  const ids = orderedIds.map((_, index) => `$${index + 2}`).join(", ");
  await (await getDatabase()).execute(`UPDATE progress_items SET sort_order = CASE id ${branches} END, updated_at = $${orderedIds.length + 2} WHERE task_id = $1 AND id IN (${ids})`, [taskId, ...orderedIds, timestamp()]);
}
export async function isDatabaseEmpty(): Promise<boolean> {
  const rows = await (await getDatabase()).select<Array<{ has_goals: number; has_tasks: number; has_progress_items: number }>>(
    `SELECT
      EXISTS(SELECT 1 FROM goals) AS has_goals,
      EXISTS(SELECT 1 FROM tasks) AS has_tasks,
      EXISTS(SELECT 1 FROM progress_items) AS has_progress_items`,
  );
  const state = rows[0];
  return !state || (!state.has_goals && !state.has_tasks && !state.has_progress_items);
}

export async function hasAnyTasks(): Promise<boolean> {
  const rows = await (await getDatabase()).select<Array<{ has_tasks: number }>>(
    "SELECT EXISTS(SELECT 1 FROM tasks) AS has_tasks",
  );
  return Boolean(rows[0]?.has_tasks);
}
