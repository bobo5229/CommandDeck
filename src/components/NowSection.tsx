import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import { ProgressItem, ProgressItemStatus, TaskDetails } from "../types/deck";
import { TaskMenu } from "./TaskMenu";

interface NowSectionProps {
  tasks: TaskDetails[];
  onEdit: (task: TaskDetails["task"]) => void;
  onStatus: (id: string, status: import("../types/deck").TaskStatus) => Promise<void>;
  onProgressCreate: (taskId: string, content: string, status: ProgressItemStatus) => Promise<void>;
  onProgressUpdate: (id: string, content: string, status: ProgressItemStatus) => Promise<void>;
  onProgressDelete: (id: string) => Promise<void>;
}

const StageGroup: React.FC<{ label: string; icon: React.ReactNode; status: ProgressItemStatus; taskId: string; items: ProgressItem[]; onCreate: NowSectionProps["onProgressCreate"]; onUpdate: NowSectionProps["onProgressUpdate"]; onDelete: NowSectionProps["onProgressDelete"] }> = ({ label, icon, status, taskId, items, onCreate, onUpdate, onDelete }) => {
  const [adding, setAdding] = useState(false); const [value, setValue] = useState(""); const [editing, setEditing] = useState<string | null>(null); const [draft, setDraft] = useState(""); const [menu, setMenu] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const run = async (action: () => Promise<void>, done?: () => void) => { setBusy(true); setError(""); try { await action(); done?.(); } catch { setError("保存失败，请重试。"); } finally { setBusy(false); } };
  return <div className="deck-stage-group"><div className="deck-stage-label">{icon}<span>{label}</span><button className="deck-text-btn" type="button" onClick={() => setAdding(!adding)}>+ Add item</button></div>
    <ul className="deck-checklist">{items.map((item) => <li key={item.id} className={`deck-checklist-item ${status}`}>
      {status === "completed" ? <span className="deck-check-bullet">✓</span> : status === "active" ? <span className="deck-in-progress-bullet" /> : <span className="deck-upcoming-bullet" />}
      {editing === item.id ? <><input className="deck-progress-input" value={draft} onChange={(e) => setDraft(e.target.value)} /><button disabled={busy || !draft.trim()} onClick={() => void run(() => onUpdate(item.id, draft.trim(), item.status), () => setEditing(null))}>Save</button><button disabled={busy} onClick={() => setEditing(null)}>Cancel</button></> : <><span>{item.content}</span><span className="deck-menu-wrap"><button className="deck-item-menu-btn" onClick={() => setMenu(menu === item.id ? null : item.id)} aria-label="Progress item actions"><MoreHorizontal size={14} /></button>{menu === item.id && <span className="deck-menu"><button onClick={() => { setDraft(item.content); setEditing(item.id); setMenu(null); }}>Edit</button>{item.status !== "completed" && <button disabled={busy} onClick={() => void run(() => onUpdate(item.id, item.content, "completed"), () => setMenu(null))}>Mark completed</button>}{item.status !== "active" && <button disabled={busy} onClick={() => void run(() => onUpdate(item.id, item.content, "active"), () => setMenu(null))}>Mark active</button>}{item.status !== "future" && <button disabled={busy} onClick={() => void run(() => onUpdate(item.id, item.content, "future"), () => setMenu(null))}>Move to future</button>}<button disabled={busy} onClick={() => { if (window.confirm("Delete this progress item?")) void run(() => onDelete(item.id), () => setMenu(null)); }}>Delete</button></span>}</span></>}</li>)}</ul>
    {adding && <div className="deck-inline-form"><input className="deck-progress-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add progress item" /><button disabled={busy || !value.trim()} onClick={() => void run(() => onCreate(taskId, value.trim(), status), () => { setValue(""); setAdding(false); })}>Add</button><button disabled={busy} onClick={() => setAdding(false)}>Cancel</button></div>}{error && <p className="deck-form-error">{error}</p>}</div>;
};

export const NowSection: React.FC<NowSectionProps> = ({ tasks, onEdit, onStatus, onProgressCreate, onProgressUpdate, onProgressDelete }) => {
  const countLabel = `${tasks.length} ${tasks.length === 1 ? "active task" : "active tasks"}`;
  // 维护卡片的展开状态映射
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tasks.forEach((t, index) => {
      initial[t.task.id] = index === 0;
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
        <span className="deck-section-count">{countLabel}</span>
      </div>

      <div className="deck-now-list">
        {tasks.length === 0 && <p className="deck-empty-state">暂无正在推进的 Task</p>}
        {tasks.map((task) => {
          const isExpanded = !!expandedIds[task.task.id];
          const completedItems = task.progressItems.filter((item) => item.status === "completed");
          const inProgressItems = task.progressItems.filter((item) => item.status === "active");
          const upcomingItems = task.progressItems.filter((item) => item.status === "future");
          return (
            <article
              key={task.task.id}
              className={`deck-now-card ${isExpanded ? "is-expanded" : "is-collapsed"}`}
            >
              <div
                className="deck-now-card-header"
                onClick={() => toggleExpand(task.task.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(task.task.id);
                  }
                }}
              >
                <div className="deck-now-card-main-info">
                  <div className="deck-now-card-meta">
                    {task.goal && <span className="deck-goal-tag">{task.goal.title}</span>}
                  </div>
                  <h3 className="deck-now-task-title">{task.task.title}</h3>
                  {task.task.currentSummary && <p className="deck-now-summary">{task.task.currentSummary}</p>}
                </div>

                <div className="deck-expand-trigger" aria-hidden="true">
                  {isExpanded ? (
                    <ChevronDown size={17} className="deck-expand-icon" />
                  ) : (
                    <ChevronRight size={17} className="deck-expand-icon" />
                  )}
                </div>
                <TaskMenu status={task.task.status} onEdit={() => onEdit(task.task)} onStatus={(status) => onStatus(task.task.id, status)} />
              </div>

              {isExpanded && (
                <div className="deck-now-details">
                  <StageGroup label="已完成" icon={<CheckCircle2 size={13} className="deck-stage-icon completed" />} status="completed" taskId={task.task.id} items={completedItems} onCreate={onProgressCreate} onUpdate={onProgressUpdate} onDelete={onProgressDelete} />

                  {/* 正在推进 */}
                  <StageGroup label="正在推进" icon={<Clock size={13} className="deck-stage-icon in-progress" />} status="active" taskId={task.task.id} items={inProgressItems} onCreate={onProgressCreate} onUpdate={onProgressUpdate} onDelete={onProgressDelete} />

                  {/* 未来 */}
                  <StageGroup label="未来" icon={<Circle size={13} className="deck-stage-icon upcoming" />} status="future" taskId={task.task.id} items={upcomingItems} onCreate={onProgressCreate} onUpdate={onProgressUpdate} onDelete={onProgressDelete} />

                  {/* Next Action */}
                  {task.task.nextAction && (
                    <div className="deck-next-action-box">
                      <div className="deck-next-action-header">
                        <ArrowRight size={13} className="deck-next-action-icon" />
                        <span className="deck-next-action-label">next_action</span>
                      </div>
                      <p className="deck-next-action-text">{task.task.nextAction}</p>
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
