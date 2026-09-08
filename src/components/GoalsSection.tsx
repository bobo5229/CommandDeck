import React from "react";
import { ChevronRight } from "lucide-react";
import { Goal } from "../types/deck";

interface GoalsSectionProps {
  goals: Goal[];
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({ goals }) => {
  const countLabel = `${goals.length} ${goals.length === 1 ? "goal" : "goals"}`;

  return (
    <section className="deck-section deck-section-goals" aria-label="Goals">
      <div className="deck-section-header">
        <span className="deck-section-title">GOALS</span>
        <span className="deck-section-count">{countLabel}<ChevronRight size={14} aria-hidden="true" /></span>
      </div>
      <div className="deck-goals-list">
        {goals.length === 0 && <p className="deck-empty-state">暂无进行中的 Goal</p>}
        {goals.map((goal) => (
          <span key={goal.id} className="deck-goal-pill">{goal.title}</span>
        ))}
      </div>
    </section>
  );
};
