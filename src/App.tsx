import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Header } from "./components/Header";
import { GoalsSection } from "./components/GoalsSection";
import { NowSection } from "./components/NowSection";
import { NextSection } from "./components/NextSection";
import { DoneSection } from "./components/DoneSection";
import { NewTaskButton } from "./components/NewTaskButton";
import { TaskEditorModal } from "./components/TaskEditorModal";
import { changeTaskStatus, createGoal, createProgressItem, createTask, deleteProgressItem, listActiveGoals, listNextTasks, listNowTasks, listRecentDoneTasks, listSelectableGoals, updateProgressItem, updateTask } from "./data/deckRepository";
import { seedDevelopmentData } from "./mock/mockData";
import type { Goal, TaskDetails, TaskWithGoal } from "./types/deck";

export const App: React.FC = () => {
  const [state, setState] = useState<{ goals: Goal[]; selectableGoals: Goal[]; now: TaskDetails[]; next: TaskWithGoal[]; done: TaskWithGoal[] }>({ goals: [], selectableGoals: [], now: [], next: [], done: [] });
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<TaskDetails["task"] | undefined>(); const [editorOpen, setEditorOpen] = useState(false);
  const reloadDeckState = useCallback(async () => { const [goals, selectableGoals, now, next, done] = await Promise.all([listActiveGoals(), listSelectableGoals(), listNowTasks(), listNextTasks(), listRecentDoneTasks()]); setState({ goals, selectableGoals, now, next, done }); }, []);
  useEffect(() => { void (async () => { try { await seedDevelopmentData(); await reloadDeckState(); } catch (reason) { console.error("Failed to load CommandDeck data", reason); setError(true); } })(); }, [reloadDeckState]);
  const status = async (id: string, value: import("./types/deck").TaskStatus) => { await changeTaskStatus(id, value); await reloadDeckState(); };
  const progressCreate = async (taskId: string, content: string, status: import("./types/deck").ProgressItemStatus) => { try { await createProgressItem({ taskId, content, status }); await reloadDeckState(); } catch (reason) { console.error("Failed to create progress item", reason); throw reason; } };
  const progressUpdate = async (id: string, content: string, status: import("./types/deck").ProgressItemStatus) => { try { await updateProgressItem(id, { content, status }); await reloadDeckState(); } catch (reason) { console.error("Failed to update progress item", reason); throw reason; } };
  const progressDelete = async (id: string) => { try { await deleteProgressItem(id); await reloadDeckState(); } catch (reason) { console.error("Failed to delete progress item", reason); throw reason; } };
  const openNewTaskEditor = () => { setEditing(undefined); setEditorOpen(true); };
  return (
    <div className="deck-app-container">
      <Header />
      <main className="deck-scroll-area">
        {error && <p className="deck-empty-state">无法加载本地数据。</p>}
        <GoalsSection goals={state.goals} />
        <NowSection tasks={state.now} hasOtherTasks={state.next.length > 0 || state.done.length > 0} onCreateTask={openNewTaskEditor} onEdit={(task) => { setEditing(task); setEditorOpen(true); }} onStatus={status} onProgressCreate={progressCreate} onProgressUpdate={progressUpdate} onProgressDelete={progressDelete} />
        <NextSection tasks={state.next} onEdit={(task) => { setEditing(task); setEditorOpen(true); }} onStatus={status} />
        <DoneSection tasks={state.done} onStatus={status} />
      </main>
      <NewTaskButton onClick={openNewTaskEditor} />
      {editorOpen && <TaskEditorModal task={editing} goals={state.selectableGoals} onClose={() => setEditorOpen(false)} onCreateGoal={async (title) => { const goal = await createGoal({ title, status: "active" }); await reloadDeckState(); return goal; }} onSave={async (values) => { if (editing) await updateTask(editing.id, values); else await createTask(values); await reloadDeckState(); }} />}
    </div>
  );
};

export default App;
