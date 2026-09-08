import React from "react";
import { Plus } from "lucide-react";

export const NewTaskButton: React.FC = () => {
  return (
    <footer className="deck-footer">
      <button
        type="button"
        className="deck-new-task-btn"
        aria-label="Create new task"
      >
        <Plus size={15} strokeWidth={2} />
        <span>New Task</span>
      </button>
    </footer>
  );
};
