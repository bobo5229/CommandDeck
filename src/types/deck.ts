export interface Goal {
  id: string;
  title: string;
  status?: "active" | "future" | "completed";
}

export interface ActiveTask {
  id: string;
  title: string;
  goalLabel: string;
  currentSummary: string;
  nextAction?: string;
  completedItems?: string[];
  inProgressItems?: string[];
  upcomingItems?: string[];
  defaultExpanded?: boolean;
}

export interface NextTask {
  id: string;
  title: string;
  goalLabel: string;
}

export interface DoneTask {
  id: string;
  title: string;
  goalLabel?: string;
}
