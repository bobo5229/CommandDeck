import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Goal, GoalStatus } from "../types/deck";
import { GoalMenu } from "./GoalMenu";

interface GoalManagerModalProps {
  goals: Goal[];
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  onRename: (id: string, title: string) => Promise<void>;
  onStatus: (id: string, status: GoalStatus) => Promise<void>;
  getOpenTaskCount: (goalId: string) => Promise<number>;
}

type PendingChange = { goal: Goal; status: "completed" | "archived"; openTaskCount: number };

const groups: Array<{ status: GoalStatus; label: string; empty: string }> = [
  { status: "active", label: "Active", empty: "No active goals" },
  { status: "future", label: "Future", empty: "No future goals" },
  { status: "completed", label: "Completed", empty: "No completed goals" },
  { status: "archived", label: "Archived", empty: "No archived goals" },
];

export const GoalManagerModal: React.FC<GoalManagerModalProps> = ({
  goals,
  onClose,
  onCreate,
  onRename,
  onStatus,
  getOpenTaskCount,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [error, setError] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);

  const goalsByStatus = useMemo(() => {
    return new Map(groups.map(({ status }) => [status, goals.filter((goal) => goal.status === status)]));
  }, [goals]);

  useEffect(() => {
    if (pending) confirmRef.current?.focus();
  }, [pending]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pending) setPending(null);
      else if (!busyId && !creating) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [busyId, creating, onClose, pending]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    setError("");
    try {
      await onCreate(title);
      setNewTitle("");
    } catch (reason) {
      console.error("Failed to create goal", reason);
      setError("Goal 创建失败，请重试。");
    } finally {
      setCreating(false);
    }
  };

  const saveRename = async (event: React.FormEvent, goal: Goal) => {
    event.preventDefault();
    const title = editingTitle.trim();
    if (!title) {
      setError("Goal 标题不能为空。");
      return;
    }
    if (title === goal.title) {
      setEditingId(null);
      return;
    }
    setBusyId(goal.id);
    setError("");
    try {
      await onRename(goal.id, title);
      setEditingId(null);
    } catch (reason) {
      console.error("Failed to rename goal", reason);
      setError("Goal 保存失败，请重试。");
    } finally {
      setBusyId(null);
    }
  };

  const applyStatus = async (goal: Goal, status: GoalStatus) => {
    setBusyId(goal.id);
    setError("");
    try {
      await onStatus(goal.id, status);
      setPending(null);
    } catch (reason) {
      console.error("Failed to change goal status", reason);
      setError("Goal 状态更新失败，请重试。");
    } finally {
      setBusyId(null);
    }
  };

  const requestStatus = async (goal: Goal, status: GoalStatus) => {
    if (status !== "completed" && status !== "archived") {
      await applyStatus(goal, status);
      return;
    }

    let openTaskCount: number;
    setBusyId(goal.id);
    setError("");
    try {
      openTaskCount = await getOpenTaskCount(goal.id);
    } catch (reason) {
      console.error("Failed to inspect goal tasks", reason);
      setError("无法检查关联 Task，请重试。");
      throw reason;
    } finally {
      setBusyId(null);
    }

    if (openTaskCount > 0) {
      setPending({ goal, status, openTaskCount });
    } else {
      await applyStatus(goal, status);
    }
  };

  return (
    <div className="deck-modal-backdrop" role="presentation" onMouseDown={() => !busyId && !creating && !pending && onClose()}>
      <section className="deck-modal deck-goal-manager" role="dialog" aria-modal="true" aria-label="Manage goals" onMouseDown={(event) => event.stopPropagation()}>
        <div className="deck-modal-header">
          <div>
            <h2>Manage Goals</h2>
            <p className="deck-modal-subtitle">Goals provide context without controlling Task status.</p>
          </div>
          <button type="button" className="deck-icon-btn" onClick={onClose} aria-label="Close goal manager" disabled={Boolean(busyId) || creating || Boolean(pending)}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <form className="deck-goal-create" onSubmit={create}>
          <label htmlFor="new-goal-title">New Goal</label>
          <div className="deck-inline-form">
            <input id="new-goal-title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Goal title" disabled={creating || Boolean(busyId)} />
            <button type="submit" className="deck-inline-add-btn" disabled={creating || Boolean(busyId) || !newTitle.trim()}>{creating ? "Adding…" : "Add"}</button>
          </div>
          <p className="deck-field-hint">New goals start in Future.</p>
        </form>

        <div className="deck-goal-groups">
          {groups.map((group) => {
            const groupGoals = goalsByStatus.get(group.status) ?? [];
            return (
              <section key={group.status} className="deck-goal-group" aria-labelledby={`goal-group-${group.status}`}>
                <div className="deck-goal-group-header">
                  <h3 id={`goal-group-${group.status}`}>{group.label}</h3>
                  <span>{groupGoals.length}</span>
                </div>
                {groupGoals.length === 0 ? (
                  <p className="deck-goal-group-empty">{group.empty}</p>
                ) : (
                  <div className="deck-goal-manager-list">
                    {groupGoals.map((goal) => (
                      <div key={goal.id} className="deck-goal-row">
                        {editingId === goal.id ? (
                          <form className="deck-goal-rename" onSubmit={(event) => void saveRename(event, goal)}>
                            <input autoFocus aria-label="Goal title" value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} disabled={busyId === goal.id} />
                            <button type="submit" disabled={busyId === goal.id || !editingTitle.trim()}>Save</button>
                            <button type="button" onClick={() => setEditingId(null)} disabled={busyId === goal.id}>Cancel</button>
                          </form>
                        ) : (
                          <>
                            <span className="deck-goal-row-title" title={goal.title}>{goal.title}</span>
                            <GoalMenu
                              status={goal.status}
                              busy={Boolean(busyId) || creating}
                              onEdit={() => { setEditingId(goal.id); setEditingTitle(goal.title); setError(""); }}
                              onStatus={(status) => requestStatus(goal, status)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {error && <p className="deck-form-error" role="alert">{error}</p>}

        {pending && (
          <div className="deck-goal-confirm-backdrop">
            <section className="deck-goal-confirm" role="alertdialog" aria-modal="true" aria-labelledby="goal-confirm-title" aria-describedby="goal-confirm-description">
              <h3 id="goal-confirm-title">{pending.status === "completed" ? "Complete this Goal?" : "Archive this Goal?"}</h3>
              <p id="goal-confirm-description">
                “{pending.goal.title}” still has {pending.openTaskCount} unfinished {pending.openTaskCount === 1 ? "Task" : "Tasks"}. Their status and Goal link will not change.
              </p>
              <div className="deck-modal-actions">
                <button type="button" className="deck-secondary-btn" onClick={() => setPending(null)} disabled={busyId === pending.goal.id}>Cancel</button>
                <button ref={confirmRef} type="button" className="deck-primary-btn" onClick={() => void applyStatus(pending.goal, pending.status)} disabled={busyId === pending.goal.id}>
                  {busyId === pending.goal.id ? "Saving…" : pending.status === "completed" ? "Complete Goal" : "Archive Goal"}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
};
