import React from "react";
import { Check } from "lucide-react";
import { DoneTask } from "../types/deck";

interface DoneSectionProps {
  tasks: DoneTask[];
}

export const DoneSection: React.FC<DoneSectionProps> = ({ tasks }) => {
  return (
    <section className="deck-section deck-section-done" aria-label="Completed Tasks">
      <div className="deck-section-header">
        <span className="deck-section-title">DONE</span>
        <span className="deck-section-count">{tasks.length}</span>
      </div>
      <div className="deck-compact-list">
        {tasks.map((task) => (
          <div key={task.id} className="deck-compact-row done-row">
            <span className="deck-done-check" aria-hidden="true">
              <Check size={12} strokeWidth={2.2} />
            </span>
            <div className="deck-compact-content">
              <span className="deck-task-name done-text">{task.title}</span>
              {task.goalLabel && (
                <span className="deck-goal-subtext">Goal: {task.goalLabel}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
