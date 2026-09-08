import React from "react";
import { CircleDot } from "lucide-react";
import { NextTask } from "../types/deck";

interface NextSectionProps {
  tasks: NextTask[];
}

export const NextSection: React.FC<NextSectionProps> = ({ tasks }) => {
  return (
    <section className="deck-section deck-section-next" aria-label="Next Tasks">
      <div className="deck-section-header">
        <span className="deck-section-title">NEXT</span>
        <span className="deck-section-count">{tasks.length}</span>
      </div>
      <div className="deck-compact-list">
        {tasks.map((task) => (
          <div key={task.id} className="deck-compact-row next-row">
            <span className="deck-row-marker" aria-hidden="true">
              <CircleDot size={12} strokeWidth={1.8} />
            </span>
            <div className="deck-compact-content">
              <span className="deck-task-name">{task.title}</span>
              <span className="deck-goal-subtext">Goal: {task.goalLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
