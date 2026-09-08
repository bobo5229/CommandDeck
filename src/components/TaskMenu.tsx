import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { TaskStatus } from "../types/deck";
export const TaskMenu: React.FC<{ status: TaskStatus; canEdit?: boolean; onEdit?: () => void; onStatus: (status: TaskStatus) => Promise<void> }> = ({ status, canEdit = true, onEdit, onStatus }) => {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const change = async (next: TaskStatus) => { setBusy(true); try { await onStatus(next); setOpen(false); } finally { setBusy(false); } };
  return <div className="deck-menu-wrap"><button className="deck-icon-btn" onClick={(event) => { event.stopPropagation(); setOpen(!open); }} aria-label="Task actions"><MoreHorizontal size={16} /></button>{open && <div className="deck-menu">{canEdit && <button onClick={() => { onEdit?.(); setOpen(false); }}>Edit</button>}{status !== "active" && <button disabled={busy} onClick={() => void change("active")}>Mark active</button>}{status !== "future" && <button disabled={busy} onClick={() => void change("future")}>Move to NEXT</button>}{status !== "completed" && <button disabled={busy} onClick={() => void change("completed")}>Mark completed</button>}{status !== "skipped" && <button disabled={busy} onClick={() => void change("skipped")}>Skip</button>}</div>}</div>;
};
