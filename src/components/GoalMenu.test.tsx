import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GoalStatus } from "../types/deck";
import { GoalMenu } from "./GoalMenu";

describe.each<Array<{ status: GoalStatus; action: string; next: GoalStatus }>>([
  [{ status: "future", action: "Mark active", next: "active" }],
  [{ status: "active", action: "Mark completed", next: "completed" }],
  [{ status: "completed", action: "Reopen as active", next: "active" }],
  [{ status: "archived", action: "Restore to future", next: "future" }],
])("GoalMenu status actions", ({ status, action, next }) => {
  it(`${status} exposes ${action}`, async () => {
    const user = userEvent.setup();
    const onStatus = vi.fn().mockResolvedValue(undefined);
    render(<GoalMenu status={status} busy={false} onEdit={vi.fn()} onStatus={onStatus} />);

    await user.click(screen.getByRole("button", { name: "Goal actions" }));
    await user.click(screen.getByRole("menuitem", { name: action }));
    expect(onStatus).toHaveBeenCalledWith(next);
  });
});
