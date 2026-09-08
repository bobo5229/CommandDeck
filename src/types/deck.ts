export type GoalStatus = "future" | "active" | "completed" | "archived";
export type TaskStatus = "future" | "active" | "completed" | "skipped";
export type ProgressItemStatus = "completed" | "active" | "future";

export interface Goal {
  id: string;
  title: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  goalId: string | null;
  title: string;
  status: TaskStatus;
  currentSummary: string | null;
  nextAction: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ProgressItem {
  id: string;
  taskId: string;
  content: string;
  status: ProgressItemStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithGoal {
  task: Task;
  goal: Goal | null;
}

export interface TaskDetails extends TaskWithGoal {
  progressItems: ProgressItem[];
}

export interface CreateGoalInput {
  title: string;
  status?: GoalStatus;
}

export interface CreateTaskInput {
  title: string;
  goalId?: string | null;
  status?: TaskStatus;
  currentSummary?: string | null;
  nextAction?: string | null;
}

export interface CreateProgressItemInput {
  taskId: string;
  content: string;
  status?: ProgressItemStatus;
  sortOrder?: number;
}
