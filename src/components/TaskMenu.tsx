import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { TaskStatus } from "../types/deck";
import { useMenuInteraction } from "./useMenuInteraction";

export const TaskMenu: React.FC<{
  status: TaskStatus;
  canEdit?: boolean;
  activeOnly?: boolean;
  onEdit?: () => void;
  onStatus: (status: TaskStatus) => Promise<void>;
}> = ({ status, canEdit = true, activeOnly = false, onEdit, onStatus }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const {
    containerRef,
    menuId,
    menuRef,
    triggerRef,
    handleMenuBlur,
    handleMenuKeyDown,
  } = useMenuInteraction({ open, onClose: () => setOpen(false) });

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
      ref={containerRef}
      className="deck-menu-wrap"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`deck-icon-btn deck-menu-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Task actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className="deck-menu"
          role="menu"
          aria-label="Task actions"
          onBlur={handleMenuBlur}
          onKeyDown={handleMenuKeyDown}
        >
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
