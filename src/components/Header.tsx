import React from "react";
import { Pin, Maximize2, X } from "lucide-react";
import { useWindowMode } from "../window/useWindowMode";

export const Header: React.FC = () => {
  const { mode, busy, error, togglePin, toggleOverlay, close } = useWindowMode();
  const pinned = mode === "pinned" || mode === "overlay";
  const overlay = mode === "overlay";

  return (
    <header className="deck-header" data-tauri-drag-region>
      <div className="deck-header-brand" data-tauri-drag-region>
        <span className="deck-brand-dot" aria-hidden="true" data-tauri-drag-region />
        <h1 className="deck-title" data-tauri-drag-region>CommandDeck</h1>
      </div>
      <div
        className="deck-header-actions"
        aria-label="窗口选项"
        data-tauri-drag-region="false"
      >
        <button
          type="button"
          className={`deck-icon-btn ${pinned ? "is-active" : ""}`}
          title={overlay ? "Overlay 始终置顶" : pinned ? "取消置顶" : "置顶窗口"}
          aria-label="Pin window"
          aria-pressed={pinned}
          disabled={busy || overlay}
          onClick={() => void togglePin()}
        >
          <Pin size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className={`deck-icon-btn ${overlay ? "is-active" : ""}`}
          title={overlay ? "退出 Overlay" : "进入 Overlay"}
          aria-label="Window mode"
          aria-pressed={overlay}
          disabled={busy}
          onClick={() => void toggleOverlay()}
        >
          <Maximize2 size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="deck-icon-btn deck-close-btn"
          title="关闭窗口 (Close)"
          aria-label="Close window"
          disabled={busy}
          onClick={() => void close()}
        >
          <X size={16} strokeWidth={1.9} />
        </button>
      </div>
      {error && <p className="deck-window-error" role="alert">{error}</p>}
    </header>
  );
};
