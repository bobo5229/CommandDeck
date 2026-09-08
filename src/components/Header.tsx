import React from "react";
import { Pin, Maximize2, MoreHorizontal, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const Header: React.FC = () => {
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
          className="deck-icon-btn"
          title="置顶窗口 (Pin)"
          aria-label="Pin window"
        >
          <Pin size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="deck-icon-btn"
          title="窗口模式 (Window Mode)"
          aria-label="Window mode"
        >
          <Maximize2 size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="deck-icon-btn"
          title="更多选项 (More)"
          aria-label="More options"
        >
          <MoreHorizontal size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="deck-icon-btn deck-close-btn"
          title="关闭窗口 (Close)"
          aria-label="Close window"
          onClick={() => void getCurrentWindow().close()}
        >
          <X size={16} strokeWidth={1.9} />
        </button>
      </div>
    </header>
  );
};
