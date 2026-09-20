import {
  PhysicalPosition,
  PhysicalSize,
  availableMonitors,
  getCurrentWindow,
  primaryMonitor,
  type Monitor,
} from "@tauri-apps/api/window";
import type { UnlistenFn } from "@tauri-apps/api/event";

export type WindowMode = "normal" | "pinned" | "overlay";

export interface WindowGeometry {
  monitorName: string | null;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface WindowPreferences {
  version: 1;
  mode: WindowMode;
  fullMode: Exclude<WindowMode, "overlay">;
  fullGeometry?: WindowGeometry;
  overlayGeometry?: WindowGeometry;
}

export interface WindowModeState {
  mode: WindowMode;
  busy: boolean;
  error: string | null;
}

const STORAGE_KEY = "commanddeck.window-preferences.v1";
const OVERLAY_WIDTH = 410;
const OVERLAY_HEIGHT = 720;
const MIN_WIDTH = 380;
const MAX_WIDTH = 460;
const MIN_HEIGHT = 500;

export const defaultWindowPreferences = (): WindowPreferences => ({
  version: 1,
  mode: "normal",
  fullMode: "normal",
});

function isWindowMode(value: unknown): value is WindowMode {
  return value === "normal" || value === "pinned" || value === "overlay";
}

function isGeometry(value: unknown): value is WindowGeometry {
  if (!value || typeof value !== "object") return false;
  const geometry = value as Partial<WindowGeometry>;
  return (typeof geometry.monitorName === "string" || geometry.monitorName === null)
    && [geometry.offsetX, geometry.offsetY, geometry.width, geometry.height].every((item) => typeof item === "number" && Number.isFinite(item));
}

export function parseWindowPreferences(raw: string | null): WindowPreferences {
  try {
    if (!raw) return defaultWindowPreferences();
    const parsed = JSON.parse(raw) as Partial<WindowPreferences>;
    if (parsed.version !== 1 || !isWindowMode(parsed.mode)) return defaultWindowPreferences();
    const fullMode = parsed.fullMode === "pinned" ? "pinned" : "normal";
    return {
      version: 1,
      mode: parsed.mode,
      fullMode,
      ...(isGeometry(parsed.fullGeometry) ? { fullGeometry: parsed.fullGeometry } : {}),
      ...(isGeometry(parsed.overlayGeometry) ? { overlayGeometry: parsed.overlayGeometry } : {}),
    };
  } catch {
    return defaultWindowPreferences();
  }
}

function readPreferences(): WindowPreferences {
  return parseWindowPreferences(localStorage.getItem(STORAGE_KEY));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function monitorForWindow(monitors: Monitor[], position: { x: number; y: number }, size: { width: number; height: number }): Monitor | undefined {
  const centerX = position.x + size.width / 2;
  const centerY = position.y + size.height / 2;
  return monitors.find((monitor) => {
    const area = monitor.workArea;
    return centerX >= area.position.x
      && centerX < area.position.x + area.size.width
      && centerY >= area.position.y
      && centerY < area.position.y + area.size.height;
  });
}

export function nextPinMode(mode: WindowMode): WindowMode {
  if (mode === "overlay") return mode;
  return mode === "pinned" ? "normal" : "pinned";
}

export function modeAfterOverlay(fullMode: WindowPreferences["fullMode"]): WindowPreferences["fullMode"] {
  return fullMode === "pinned" ? "pinned" : "normal";
}

export function resolveWindowBounds(
  geometry: WindowGeometry,
  monitors: Monitor[],
  fallbackMonitor: Monitor | null,
): { position: { x: number; y: number }; size: { width: number; height: number }; monitor: Monitor } {
  const monitor = monitors.find((candidate) => candidate.name === geometry.monitorName)
    ?? fallbackMonitor
    ?? monitors[0];
  if (!monitor) throw new Error("No monitor is available for restoring the CommandDeck window.");

  const scale = monitor.scaleFactor;
  const workArea = monitor.workArea;
  const maxLogicalWidth = workArea.size.width / scale;
  const maxLogicalHeight = workArea.size.height / scale;
  const logicalWidth = clamp(geometry.width, Math.min(MIN_WIDTH, maxLogicalWidth), Math.min(MAX_WIDTH, maxLogicalWidth));
  const logicalHeight = clamp(geometry.height, Math.min(MIN_HEIGHT, maxLogicalHeight), maxLogicalHeight);
  const width = Math.round(logicalWidth * scale);
  const height = Math.round(logicalHeight * scale);
  const desiredX = workArea.position.x + Math.round(geometry.offsetX * scale);
  const desiredY = workArea.position.y + Math.round(geometry.offsetY * scale);
  const x = clamp(desiredX, workArea.position.x, workArea.position.x + workArea.size.width - width);
  const y = clamp(desiredY, workArea.position.y, workArea.position.y + workArea.size.height - height);

  return { position: { x, y }, size: { width, height }, monitor };
}

class WindowModeController {
  private preferences = readPreferences();
  private state: WindowModeState = { mode: this.preferences.mode, busy: true, error: null };
  private listeners = new Set<() => void>();
  private initialization?: Promise<void>;
  private unlisteners: UnlistenFn[] = [];
  private captureTimer?: number;
  private transitioning = false;

  private get appWindow() {
    return getCurrentWindow();
  }

  getSnapshot = (): WindowModeState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  initialize(): Promise<void> {
    this.initialization ??= this.initializeOnce();
    return this.initialization;
  }

  private emit(patch: Partial<WindowModeState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
  }

  private async initializeOnce(): Promise<void> {
    this.transitioning = true;
    try {
      const storedGeometry = this.preferences.mode === "overlay"
        ? this.preferences.overlayGeometry
        : this.preferences.fullGeometry;
      if (storedGeometry) {
        await this.restoreGeometry(storedGeometry);
      } else {
        const current = await this.captureGeometry();
        if (this.preferences.mode === "overlay") {
          await this.restoreGeometry({ ...current, width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT });
        } else {
          this.preferences.fullGeometry = current;
        }
      }
      await this.appWindow.setAlwaysOnTop(this.preferences.mode !== "normal");
      this.persist();
      this.emit({ mode: this.preferences.mode, busy: false, error: null });
      await this.attachGeometryListeners();
    } catch (reason) {
      console.error("Failed to initialize window mode", reason);
      this.emit({ busy: false, error: "窗口状态恢复失败。" });
    } finally {
      this.transitioning = false;
    }
  }

  private async attachGeometryListeners(): Promise<void> {
    if (this.unlisteners.length) return;
    const scheduleCapture = () => {
      if (this.transitioning) return;
      window.clearTimeout(this.captureTimer);
      this.captureTimer = window.setTimeout(() => void this.captureCurrentSlot(), 250);
    };
    this.unlisteners = await Promise.all([
      this.appWindow.onMoved(scheduleCapture),
      this.appWindow.onResized(scheduleCapture),
    ]);
  }

  private async captureGeometry(): Promise<WindowGeometry> {
    const [position, size, monitors, fallbackMonitor] = await Promise.all([
      this.appWindow.outerPosition(),
      this.appWindow.outerSize(),
      availableMonitors(),
      primaryMonitor(),
    ]);
    const monitor = monitorForWindow(monitors, position, size) ?? fallbackMonitor ?? monitors[0];
    if (!monitor) {
      throw new Error("No monitor is available for the CommandDeck window.");
    }
    const scale = monitor.scaleFactor;
    return {
      monitorName: monitor.name,
      offsetX: (position.x - monitor.workArea.position.x) / scale,
      offsetY: (position.y - monitor.workArea.position.y) / scale,
      width: size.width / scale,
      height: size.height / scale,
    };
  }

  private async restoreGeometry(geometry: WindowGeometry): Promise<void> {
    const monitors = await availableMonitors();
    const fallbackMonitor = await primaryMonitor();
    const bounds = resolveWindowBounds(geometry, monitors, fallbackMonitor);
    await this.appWindow.setSize(new PhysicalSize(bounds.size.width, bounds.size.height));
    await this.appWindow.setPosition(new PhysicalPosition(bounds.position.x, bounds.position.y));
  }

  private async captureCurrentSlot(): Promise<void> {
    try {
      const geometry = await this.captureGeometry();
      if (this.preferences.mode === "overlay") this.preferences.overlayGeometry = geometry;
      else this.preferences.fullGeometry = geometry;
      this.persist();
    } catch (reason) {
      console.error("Failed to save window geometry", reason);
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    if (this.state.busy) return;
    this.emit({ busy: true, error: null });
    try {
      await action();
      this.emit({ mode: this.preferences.mode, busy: false, error: null });
    } catch (reason) {
      console.error("Window action failed", reason);
      this.emit({ busy: false, error: "窗口操作失败，请重试。" });
    }
  }

  togglePin = async (): Promise<void> => {
    if (this.preferences.mode === "overlay") return;
    await this.run(async () => {
      const nextMode = nextPinMode(this.preferences.mode);
      if (nextMode === "overlay") return;
      await this.appWindow.setAlwaysOnTop(nextMode === "pinned");
      this.preferences.mode = nextMode;
      this.preferences.fullMode = nextMode;
      this.persist();
    });
  };

  toggleOverlay = async (): Promise<void> => {
    await this.run(async () => {
      this.transitioning = true;
      try {
        const currentGeometry = await this.captureGeometry();
        if (this.preferences.mode === "overlay") {
          this.preferences.overlayGeometry = currentGeometry;
          const nextMode = modeAfterOverlay(this.preferences.fullMode);
          if (this.preferences.fullGeometry) await this.restoreGeometry(this.preferences.fullGeometry);
          await this.appWindow.setAlwaysOnTop(nextMode === "pinned");
          this.preferences.mode = nextMode;
        } else {
          this.preferences.fullGeometry = currentGeometry;
          this.preferences.fullMode = this.preferences.mode;
          const overlayGeometry = this.preferences.overlayGeometry
            ?? { ...currentGeometry, width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT };
          await this.appWindow.setAlwaysOnTop(true);
          await this.restoreGeometry(overlayGeometry);
          this.preferences.mode = "overlay";
        }
        this.persist();
      } finally {
        this.transitioning = false;
      }
    });
  };

  close = async (): Promise<void> => {
    if (this.state.busy) return;
    try {
      window.clearTimeout(this.captureTimer);
      await this.captureCurrentSlot();
      await this.appWindow.close();
    } catch (reason) {
      console.error("Failed to close window", reason);
      this.emit({ error: "无法关闭窗口，请重试。" });
    }
  };
}

export const windowModeController = new WindowModeController();
