import React from "react";
import { ChevronRight } from "lucide-react";
import { Goal } from "../types/deck";

interface GoalsSectionProps {
  goals: Goal[];
  onManage: () => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({ goals, onManage }) => {
  const countLabel = `${goals.length} ${goals.length === 1 ? "goal" : "goals"}`;

  return (
    <section className="deck-section deck-section-goals" aria-label="Goals">
      <button type="button" className="deck-section-header deck-goals-manage-trigger" onClick={onManage} aria-label="Manage goals">
        <span className="deck-section-title">GOALS</span>
        <span className="deck-section-count">{countLabel}<ChevronRight size={14} aria-hidden="true" /></span>
      </button>
      <div className="deck-goals-list">
        {goals.length === 0 && <p className="deck-empty-state">暂无进行中的 Goal</p>}
        {goals.map((goal) => (
          <span key={goal.id} className="deck-goal-pill">{goal.title}</span>
        ))}
      </div>
    </section>
  );
};
