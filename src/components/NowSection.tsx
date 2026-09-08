import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
} from "lucide-react";
import { ActiveTask } from "../types/deck";

interface NowSectionProps {
  tasks: ActiveTask[];
}

export const NowSection: React.FC<NowSectionProps> = ({ tasks }) => {
  // 维护卡片的展开状态映射
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tasks.forEach((t) => {
      initial[t.id] = t.defaultExpanded ?? false;
    });
    return initial;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="deck-section deck-section-now" aria-label="Now Active Tasks">
      <div className="deck-section-header">
        <div className="deck-section-title-wrap">
          <span className="deck-pulse-indicator" aria-hidden="true" />
          <span className="deck-section-title">NOW</span>
        </div>
        <span className="deck-section-count">{tasks.length}</span>
      </div>

      <div className="deck-now-list">
        {tasks.map((task) => {
          const isExpanded = !!expandedIds[task.id];
          return (
            <article
              key={task.id}
              className={`deck-now-card ${isExpanded ? "is-expanded" : "is-collapsed"}`}
            >
              <div
                className="deck-now-card-header"
                onClick={() => toggleExpand(task.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(task.id);
                  }
                }}
              >
                <div className="deck-now-card-main-info">
                  <div className="deck-now-card-meta">
                    <span className="deck-goal-tag">{task.goalLabel}</span>
                  </div>
                  <h3 className="deck-now-task-title">{task.title}</h3>
                  <p className="deck-now-summary">{task.currentSummary}</p>
                </div>

                <div className="deck-expand-trigger" aria-hidden="true">
                  {isExpanded ? (
                    <ChevronDown size={17} className="deck-expand-icon" />
                  ) : (
                    <ChevronRight size={17} className="deck-expand-icon" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="deck-now-details">
                  {/* 已完成 */}
                  {task.completedItems && task.completedItems.length > 0 && (
                    <div className="deck-stage-group">
                      <div className="deck-stage-label">
                        <CheckCircle2 size={13} className="deck-stage-icon completed" />
                        <span>已完成</span>
                      </div>
                      <ul className="deck-checklist">
                        {task.completedItems.map((item, idx) => (
                          <li key={idx} className="deck-checklist-item completed">
                            <span className="deck-check-bullet">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 正在推进 */}
                  {task.inProgressItems && task.inProgressItems.length > 0 && (
                    <div className="deck-stage-group">
                      <div className="deck-stage-label">
                        <Clock size={13} className="deck-stage-icon in-progress" />
                        <span>正在推进</span>
                      </div>
                      <ul className="deck-checklist">
                        {task.inProgressItems.map((item, idx) => (
                          <li key={idx} className="deck-checklist-item in-progress">
                            <span className="deck-in-progress-bullet" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 未来 */}
                  {task.upcomingItems && task.upcomingItems.length > 0 && (
                    <div className="deck-stage-group">
                      <div className="deck-stage-label">
                        <Circle size={13} className="deck-stage-icon upcoming" />
                        <span>未来</span>
                      </div>
                      <ul className="deck-checklist">
                        {task.upcomingItems.map((item, idx) => (
                          <li key={idx} className="deck-checklist-item upcoming">
                            <span className="deck-upcoming-bullet" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Action */}
                  {task.nextAction && (
                    <div className="deck-next-action-box">
                      <div className="deck-next-action-header">
                        <ArrowRight size={13} className="deck-next-action-icon" />
                        <span className="deck-next-action-label">next_action</span>
                      </div>
                      <p className="deck-next-action-text">{task.nextAction}</p>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
