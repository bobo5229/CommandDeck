import React from "react";
import { Target } from "lucide-react";
import { Goal } from "../types/deck";

interface GoalsSectionProps {
  goals: Goal[];
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({ goals }) => {
  return (
    <section className="deck-section deck-section-goals" aria-label="Goals">
      <div className="deck-section-header">
        <span className="deck-section-title">GOALS</span>
        <span className="deck-section-count">{goals.length}</span>
      </div>
      <div className="deck-goals-list">
        {goals.map((goal) => (
          <div key={goal.id} className="deck-goal-row">
            <span className="deck-goal-icon-wrap" aria-hidden="true">
              <Target size={13} strokeWidth={2} />
            </span>
            <span className="deck-goal-text">{goal.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
