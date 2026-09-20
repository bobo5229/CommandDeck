import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Goal, Task } from "../types/deck";
import { TaskEditorModal } from "./TaskEditorModal";

describe("TaskEditorModal Goal association", () => {
  it("preserves an existing archived Goal while preventing it from being newly selected", async () => {
    const user = userEvent.setup();
    const archivedGoal: Goal = {
      id: "archived-goal",
      title: "Past direction",
      status: "archived",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
    };
    const task: Task = {
      id: "task-1",
      goalId: archivedGoal.id,
      title: "Retained task",
      status: "active",
      currentSummary: null,
      nextAction: null,
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
      completedAt: null,
    };
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<TaskEditorModal task={task} goals={[archivedGoal]} onClose={vi.fn()} onSave={onSave} onCreateGoal={vi.fn()} />);
    const option = screen.getByRole("option", { name: "Past direction (archived)" });
    expect(option).toBeDisabled();
    expect((option as HTMLOptionElement).selected).toBe(true);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ goalId: archivedGoal.id })));
  });
});
