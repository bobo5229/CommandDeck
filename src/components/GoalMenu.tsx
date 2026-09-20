import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { GoalStatus } from "../types/deck";
import { useMenuInteraction } from "./useMenuInteraction";

interface GoalMenuProps {
  status: GoalStatus;
  busy: boolean;
  onEdit: () => void;
  onStatus: (status: GoalStatus) => Promise<void>;
}

export const GoalMenu: React.FC<GoalMenuProps> = ({ status, busy, onEdit, onStatus }) => {
  const [open, setOpen] = useState(false);
  const {
    containerRef,
    menuId,
    menuRef,
    triggerRef,
    handleMenuBlur,
    handleMenuKeyDown,
  } = useMenuInteraction({ open, onClose: () => setOpen(false) });

  const change = async (next: GoalStatus) => {
    try {
      await onStatus(next);
      setOpen(false);
    } catch {
      // The manager owns and displays action errors.
    }
  };

  return (
    <div ref={containerRef} className="deck-menu-wrap">
      <button
        ref={triggerRef}
        type="button"
        className={`deck-icon-btn deck-menu-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Goal actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={busy}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className="deck-menu"
          role="menu"
          aria-label="Goal actions"
          onBlur={handleMenuBlur}
          onKeyDown={handleMenuKeyDown}
        >
          <button type="button" role="menuitem" className="deck-menu-item" onClick={() => { onEdit(); setOpen(false); }}>
            Edit title
          </button>
          {status === "future" && (
            <button type="button" role="menuitem" className="deck-menu-item" disabled={busy} onClick={() => void change("active")}>
              Mark active
            </button>
          )}
          {status === "active" && (
            <>
              <button type="button" role="menuitem" className="deck-menu-item" disabled={busy} onClick={() => void change("future")}>
                Move to future
              </button>
              <button type="button" role="menuitem" className="deck-menu-item" disabled={busy} onClick={() => void change("completed")}>
                Mark completed
              </button>
            </>
          )}
          {status === "completed" && (
            <button type="button" role="menuitem" className="deck-menu-item" disabled={busy} onClick={() => void change("active")}>
              Reopen as active
            </button>
          )}
          {status === "archived" ? (
            <button type="button" role="menuitem" className="deck-menu-item" disabled={busy} onClick={() => void change("future")}>
              Restore to future
            </button>
          ) : (
            <button type="button" role="menuitem" className="deck-menu-item deck-menu-item--destructive" disabled={busy} onClick={() => void change("archived")}>
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
};
