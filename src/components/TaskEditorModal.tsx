import React, { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { Goal, Task, TaskStatus } from "../types/deck";

interface Props {
  task?: Task;
  goals: Goal[];
  onClose: () => void;
  onSave: (values: { title: string; goalId: string | null; status?: TaskStatus; currentSummary: string | null; nextAction: string | null }) => Promise<void>;
  onCreateGoal: (title: string) => Promise<Goal>;
}

export const TaskEditorModal: React.FC<Props> = ({ task, goals, onClose, onSave, onCreateGoal }) => {
  const [title, setTitle] = useState(task?.title ?? "");
  const [goalId, setGoalId] = useState(task?.goalId ?? "");
  const [status, setStatus] = useState<TaskStatus>("future");
  const [summary, setSummary] = useState(task?.currentSummary ?? "");
  const [nextAction, setNextAction] = useState(task?.nextAction ?? "");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [showGoalCreate, setShowGoalCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const availableGoals = goals.filter((goal) => goal.status === "active" || goal.status === "future" || goal.id === task?.goalId);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        goalId: goalId || null,
        ...(task ? {} : { status }),
        currentSummary: summary.trim() || null,
        nextAction: nextAction.trim() || null,
      });
      onClose();
    } catch (reason) {
      console.error("Failed to save task", reason);
      setError("保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  };

  const createGoal = async () => {
    if (!newGoalTitle.trim()) return;

    setSaving(true);
    try {
      const goal = await onCreateGoal(newGoalTitle.trim());
      setGoalId(goal.id);
      setNewGoalTitle("");
      setShowGoalCreate(false);
    } catch (reason) {
      console.error("Failed to create goal", reason);
      setError("Goal 创建失败，请重试。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="deck-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="deck-modal" role="dialog" aria-modal="true" aria-label={task ? "Edit task" : "New task"} onMouseDown={(event) => event.stopPropagation()}>
        <form onSubmit={submit}>
          <div className="deck-modal-header">
            <h2>{task ? "Edit Task" : "New Task"}</h2>
            <button type="button" className="deck-icon-btn" onClick={onClose} aria-label="Close editor" disabled={saving}>
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          <label className="deck-field">
            <span>Title</span>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} disabled={saving} />
          </label>

          <label className="deck-field">
            <span>Goal</span>
            <span className="deck-select-control">
              <select value={goalId} onChange={(event) => setGoalId(event.target.value)} disabled={saving}>
                <option value="">No Goal</option>
                {availableGoals.map((goal) => (
                  <option key={goal.id} value={goal.id} disabled={goal.status === "completed" || goal.status === "archived"}>
                    {goal.title}{goal.status === "completed" || goal.status === "archived" ? ` (${goal.status})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>

          <button type="button" className="deck-text-btn deck-new-goal-btn" onClick={() => setShowGoalCreate(!showGoalCreate)} disabled={saving}>
            + New Goal
          </button>
          {showGoalCreate && (
            <div className="deck-inline-form">
              <input aria-label="New goal title" value={newGoalTitle} onChange={(event) => setNewGoalTitle(event.target.value)} placeholder="Goal title" disabled={saving} />
              <button type="button" className="deck-inline-add-btn" onClick={() => void createGoal()} disabled={saving || !newGoalTitle.trim()}>Add</button>
            </div>
          )}

          {!task && (
            <fieldset className="deck-status-control">
              <legend>Status</legend>
              <div className="deck-segmented-control">
                <label>
                  <input type="radio" name="task-status" value="future" checked={status === "future"} onChange={() => setStatus("future")} disabled={saving} />
                  <span>Future</span>
                </label>
                <label>
                  <input type="radio" name="task-status" value="active" checked={status === "active"} onChange={() => setStatus("active")} disabled={saving} />
                  <span>Active</span>
                </label>
              </div>
            </fieldset>
          )}

          <label className="deck-field">
            <span>Current summary</span>
            <textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} disabled={saving} />
          </label>
          <label className="deck-field">
            <span>Next action</span>
            <textarea rows={3} value={nextAction} onChange={(event) => setNextAction(event.target.value)} disabled={saving} />
          </label>

          {error && <p className="deck-form-error">{error}</p>}
          <div className="deck-modal-actions">
            <button type="button" className="deck-secondary-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="deck-primary-btn" disabled={saving}>{saving ? "Saving…" : task ? "Save Changes" : "Create Task"}</button>
          </div>
        </form>
      </section>
    </div>
  );
};
