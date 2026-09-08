import React from "react";
import { Check } from "lucide-react";
import { TaskWithGoal } from "../types/deck";

interface DoneSectionProps {
  tasks: TaskWithGoal[];
}

export const DoneSection: React.FC<DoneSectionProps> = ({ tasks }) => {
  return (
    <section className="deck-section deck-section-done" aria-label="Completed Tasks">
      <div className="deck-section-header">
        <span className="deck-section-title">DONE</span>
        <span className="deck-section-count">{tasks.length}</span>
      </div>
      <div className="deck-compact-list">
        {tasks.length === 0 && <p className="deck-empty-state">暂无已完成的 Task</p>}
        {tasks.map((task) => (
          <div key={task.task.id} className="deck-compact-row done-row">
            <span className="deck-done-check" aria-hidden="true">
              <Check size={12} strokeWidth={2.2} />
            </span>
            <div className="deck-compact-content">
              <span className="deck-task-name done-text">{task.task.title}</span>
              {task.goal && (
                <span className="deck-goal-subtext">Goal: {task.goal.title}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
