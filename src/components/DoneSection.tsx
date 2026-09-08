import React, { useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { TaskWithGoal } from "../types/deck";
import { TaskMenu } from "./TaskMenu";

interface DoneSectionProps {
  tasks: TaskWithGoal[];
  onStatus: (id: string, status: import("../types/deck").TaskStatus) => Promise<void>;
}

export const DoneSection: React.FC<DoneSectionProps> = ({ tasks, onStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const countLabel = `${tasks.length} completed`;

  return (
    <section className="deck-section deck-section-done" aria-label="Completed Tasks">
      <button type="button" className="deck-section-summary" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="done-task-list">
        <span className="deck-section-title">DONE</span>
        <span className="deck-section-count">
          {countLabel}
          {expanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
        </span>
      </button>
      {expanded && (
        <div id="done-task-list" className="deck-compact-list">
          {tasks.length === 0 && <p className="deck-empty-state">暂无已完成的 Task</p>}
          {tasks.map((task) => (
            <div key={task.task.id} className="deck-compact-row done-row">
              <span className="deck-done-check" aria-hidden="true">
                <Check size={12} strokeWidth={2.2} />
              </span>
              <div className="deck-compact-content">
                <span className="deck-task-name done-text">{task.task.title}</span>
                {task.goal && <span className="deck-goal-subtext">Goal: {task.goal.title}</span>}
              </div>
              <TaskMenu status={task.task.status} canEdit={false} activeOnly onStatus={(status) => onStatus(task.task.id, status)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
