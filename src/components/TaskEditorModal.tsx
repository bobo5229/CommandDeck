import React, { useEffect, useState } from "react";
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
  useEffect(() => { const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onClose]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!title.trim()) { setError("Title is required."); return; } setSaving(true); setError(""); try { await onSave({ title: title.trim(), goalId: goalId || null, ...(task ? {} : { status }), currentSummary: summary.trim() || null, nextAction: nextAction.trim() || null }); onClose(); } catch (reason) { console.error("Failed to save task", reason); setError("保存失败，请重试。"); } finally { setSaving(false); } };
  const createGoal = async () => { if (!newGoalTitle.trim()) return; setSaving(true); try { const goal = await onCreateGoal(newGoalTitle.trim()); setGoalId(goal.id); setNewGoalTitle(""); setShowGoalCreate(false); } catch (reason) { console.error("Failed to create goal", reason); setError("Goal 创建失败，请重试。"); } finally { setSaving(false); } };
  return <div className="deck-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="deck-modal" role="dialog" aria-modal="true" aria-label={task ? "Edit task" : "New task"} onMouseDown={(event) => event.stopPropagation()}><form onSubmit={submit}>
    <div className="deck-modal-header"><h2>{task ? "Edit Task" : "New Task"}</h2><button type="button" className="deck-icon-btn" onClick={onClose} aria-label="Close editor">×</button></div>
    <label>Title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} disabled={saving} /></label>
    <label>Goal<select value={goalId} onChange={(event) => setGoalId(event.target.value)} disabled={saving}><option value="">No Goal</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
    <button type="button" className="deck-text-btn" onClick={() => setShowGoalCreate(!showGoalCreate)}>+ New Goal</button>
    {showGoalCreate && <div className="deck-inline-form"><input aria-label="New goal title" value={newGoalTitle} onChange={(event) => setNewGoalTitle(event.target.value)} placeholder="Goal title" /><button type="button" onClick={() => void createGoal()} disabled={saving || !newGoalTitle.trim()}>Add</button></div>}
    {!task && <fieldset><legend>Status</legend><label><input type="radio" checked={status === "future"} onChange={() => setStatus("future")} /> Future</label><label><input type="radio" checked={status === "active"} onChange={() => setStatus("active")} /> Active</label></fieldset>}
    <label>Current summary<textarea value={summary} onChange={(event) => setSummary(event.target.value)} disabled={saving} /></label><label>Next action<textarea value={nextAction} onChange={(event) => setNextAction(event.target.value)} disabled={saving} /></label>
    {error && <p className="deck-form-error">{error}</p>}<div className="deck-modal-actions"><button type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="deck-primary-btn" disabled={saving}>{saving ? "Saving…" : task ? "Save" : "Create"}</button></div>
  </form></section></div>;
};
