import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskMenu } from "./TaskMenu";

describe("TaskMenu keyboard interaction", () => {
  it("moves focus through the menu and restores it on Escape", async () => {
    const user = userEvent.setup();
    render(<TaskMenu status="active" onEdit={vi.fn()} onStatus={vi.fn().mockResolvedValue(undefined)} />);
    const trigger = screen.getByRole("button", { name: "Task actions" });

    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Skip" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Skip" })).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when the user clicks outside the menu", async () => {
    const user = userEvent.setup();
    render(<><TaskMenu status="future" onStatus={vi.fn().mockResolvedValue(undefined)} /><button type="button">Outside</button></>);
    await user.click(screen.getByRole("button", { name: "Task actions" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
