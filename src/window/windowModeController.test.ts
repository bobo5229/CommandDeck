import { describe, expect, it } from "vitest";
import type { Monitor } from "@tauri-apps/api/window";
import {
  defaultWindowPreferences,
  modeAfterOverlay,
  monitorForWindow,
  nextPinMode,
  parseWindowPreferences,
  resolveWindowBounds,
  type WindowGeometry,
} from "./windowModeController";

function monitor(name: string, x: number, y: number, width: number, height: number, scaleFactor = 1): Monitor {
  return {
    name,
    scaleFactor,
    position: { x, y },
    size: { width, height },
    workArea: { position: { x, y }, size: { width, height } },
  } as Monitor;
}

describe("window preferences", () => {
  it("falls back when persisted data is missing or malformed", () => {
    expect(parseWindowPreferences(null)).toEqual(defaultWindowPreferences());
    expect(parseWindowPreferences("not-json")).toEqual(defaultWindowPreferences());
    expect(parseWindowPreferences(JSON.stringify({ version: 1, mode: "unknown" }))).toEqual(defaultWindowPreferences());
  });

  it("keeps valid modes and ignores malformed geometry", () => {
    const parsed = parseWindowPreferences(JSON.stringify({
      version: 1,
      mode: "overlay",
      fullMode: "pinned",
      fullGeometry: { monitorName: "Primary", offsetX: 20, offsetY: 30, width: 430, height: 800 },
      overlayGeometry: { monitorName: "Primary", offsetX: "bad", offsetY: 10, width: 410, height: 720 },
    }));

    expect(parsed.mode).toBe("overlay");
    expect(parsed.fullMode).toBe("pinned");
    expect(parsed.fullGeometry?.width).toBe(430);
    expect(parsed.overlayGeometry).toBeUndefined();
  });
});

describe("window mode transitions", () => {
  it("toggles pin without allowing Overlay to become unpinned", () => {
    expect(nextPinMode("normal")).toBe("pinned");
    expect(nextPinMode("pinned")).toBe("normal");
    expect(nextPinMode("overlay")).toBe("overlay");
  });

  it("restores the remembered full mode after Overlay", () => {
    expect(modeAfterOverlay("normal")).toBe("normal");
    expect(modeAfterOverlay("pinned")).toBe("pinned");
  });
});

describe("window geometry", () => {
  it("selects the monitor containing the window center", () => {
    const left = monitor("Left", -1920, 0, 1920, 1080);
    const primary = monitor("Primary", 0, 0, 1920, 1080);
    expect(monitorForWindow([left, primary], { x: -500, y: 100 }, { width: 400, height: 700 })).toBe(left);
    expect(monitorForWindow([left, primary], { x: 300, y: 100 }, { width: 400, height: 700 })).toBe(primary);
  });

  it("restores logical geometry using the target monitor DPI", () => {
    const target = monitor("4K", 1920, 0, 3840, 2160, 1.5);
    const geometry: WindowGeometry = { monitorName: "4K", offsetX: 100, offsetY: 80, width: 410, height: 720 };
    const bounds = resolveWindowBounds(geometry, [target], null);

    expect(bounds.position).toEqual({ x: 2070, y: 120 });
    expect(bounds.size).toEqual({ width: 615, height: 1080 });
  });

  it("falls back to the primary monitor and clamps off-screen geometry", () => {
    const primary = monitor("Primary", 0, 0, 1920, 1040, 1);
    const geometry: WindowGeometry = { monitorName: "Disconnected", offsetX: 5000, offsetY: 5000, width: 900, height: 1400 };
    const bounds = resolveWindowBounds(geometry, [primary], primary);

    expect(bounds.monitor).toBe(primary);
    expect(bounds.size).toEqual({ width: 460, height: 1040 });
    expect(bounds.position).toEqual({ x: 1460, y: 0 });
  });
});
