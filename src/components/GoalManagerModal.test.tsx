import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Goal } from "../types/deck";
import { GoalManagerModal } from "./GoalManagerModal";

const activeGoal: Goal = {
  id: "goal-active",
  title: "Ship CommandDeck",
  status: "active",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
};

function renderManager(goals: Goal[] = [activeGoal]) {
  const callbacks = {
    onClose: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined),
    onRename: vi.fn().mockResolvedValue(undefined),
    onStatus: vi.fn().mockResolvedValue(undefined),
    getOpenTaskCount: vi.fn().mockResolvedValue(0),
  };
  render(<GoalManagerModal goals={goals} {...callbacks} />);
  return callbacks;
}

describe("GoalManagerModal", () => {
  it("creates a Goal with a trimmed title", async () => {
    const user = userEvent.setup();
    const callbacks = renderManager([]);
    await user.type(screen.getByRole("textbox", { name: "New Goal" }), "  New direction  ");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(callbacks.onCreate).toHaveBeenCalledWith("New direction");
  });

  it("renames a Goal inline", async () => {
    const user = userEvent.setup();
    const callbacks = renderManager();
    await user.click(screen.getByRole("button", { name: "Goal actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit title" }));
    const title = screen.getByRole("textbox", { name: "Goal title" });
    await user.clear(title);
    await user.type(title, "  Release v0  ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(callbacks.onRename).toHaveBeenCalledWith(activeGoal.id, "Release v0");
  });

  it("asks for confirmation before archiving a Goal with unfinished Tasks", async () => {
    const user = userEvent.setup();
    const callbacks = renderManager();
    callbacks.getOpenTaskCount.mockResolvedValue(2);
    await user.click(screen.getByRole("button", { name: "Goal actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent("2 unfinished Tasks");
    expect(callbacks.onStatus).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(callbacks.onStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Goal actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Archive Goal" }));
    await waitFor(() => expect(callbacks.onStatus).toHaveBeenCalledWith(activeGoal.id, "archived"));
  });

  it("restores an archived Goal to Future without confirmation", async () => {
    const user = userEvent.setup();
    const archived = { ...activeGoal, status: "archived" as const };
    const callbacks = renderManager([archived]);
    await user.click(screen.getByRole("button", { name: "Goal actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Restore to future" }));
    await waitFor(() => expect(callbacks.onStatus).toHaveBeenCalledWith(archived.id, "future"));
    expect(callbacks.getOpenTaskCount).not.toHaveBeenCalled();
  });
});
