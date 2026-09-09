import React, { useState, useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import type { TaskStatus } from "../types/deck";

export const TaskMenu: React.FC<{
  status: TaskStatus;
  canEdit?: boolean;
  activeOnly?: boolean;
  onEdit?: () => void;
  onStatus: (status: TaskStatus) => Promise<void>;
}> = ({ status, canEdit = true, activeOnly = false, onEdit, onStatus }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const change = async (next: TaskStatus) => {
    setBusy(true);
    try {
      await onStatus(next);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={menuRef}
      className="deck-menu-wrap"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={`deck-icon-btn deck-menu-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Task actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="deck-menu" role="menu">
          {canEdit && (
            <button
              type="button"
              role="menuitem"
              className="deck-menu-item"
              onClick={() => {
                onEdit?.();
                setOpen(false);
              }}
            >
              Edit
            </button>
          )}
          {status !== "active" && (
            <button
              type="button"
              role="menuitem"
              className="deck-menu-item"
              disabled={busy}
              onClick={() => void change("active")}
            >
              Mark active
            </button>
          )}
          {!activeOnly && (
            <>
              {status !== "future" && (
                <button
                  type="button"
                  role="menuitem"
                  className="deck-menu-item"
                  disabled={busy}
                  onClick={() => void change("future")}
                >
                  Move to NEXT
                </button>
              )}
              {status !== "completed" && (
                <button
                  type="button"
                  role="menuitem"
                  className="deck-menu-item"
                  disabled={busy}
                  onClick={() => void change("completed")}
                >
                  Mark completed
                </button>
              )}
              {status !== "skipped" && (
                <button
                  type="button"
                  role="menuitem"
                  className="deck-menu-item deck-menu-item--destructive"
                  disabled={busy}
                  onClick={() => void change("skipped")}
                >
                  Skip
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
