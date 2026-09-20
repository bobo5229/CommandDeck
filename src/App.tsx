import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Header } from "./components/Header";
import { GoalsSection } from "./components/GoalsSection";
import { NowSection } from "./components/NowSection";
import { NextSection } from "./components/NextSection";
import { DoneSection } from "./components/DoneSection";
import { NewTaskButton } from "./components/NewTaskButton";
import { TaskEditorModal } from "./components/TaskEditorModal";
import { GoalManagerModal } from "./components/GoalManagerModal";
import { changeGoalStatus, changeTaskStatus, countOpenTasksForGoal, createGoal, createProgressItem, createTask, deleteProgressItem, hasAnyTasks, listActiveGoals, listAllGoals, listNextTasks, listNowTasks, listRecentDoneTasks, updateGoal, updateProgressItem, updateTask } from "./data/deckRepository";
import { seedDevelopmentData } from "./mock/mockData";
import type { Goal, TaskDetails, TaskWithGoal } from "./types/deck";

export const App: React.FC = () => {
  const [state, setState] = useState<{ goals: Goal[]; allGoals: Goal[]; now: TaskDetails[]; next: TaskWithGoal[]; done: TaskWithGoal[]; hasTasks: boolean }>({ goals: [], allGoals: [], now: [], next: [], done: [], hasTasks: false });
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<TaskDetails["task"] | undefined>(); const [editorOpen, setEditorOpen] = useState(false);
  const [goalManagerOpen, setGoalManagerOpen] = useState(false);
  const reloadDeckState = useCallback(async () => { const [goals, allGoals, now, next, done, hasTasks] = await Promise.all([listActiveGoals(), listAllGoals(), listNowTasks(), listNextTasks(), listRecentDoneTasks(), hasAnyTasks()]); setState({ goals, allGoals, now, next, done, hasTasks }); }, []);
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
        <GoalsSection goals={state.goals} onManage={() => setGoalManagerOpen(true)} />
        <NowSection tasks={state.now} hasAnyTasks={state.hasTasks} onCreateTask={openNewTaskEditor} onEdit={(task) => { setEditing(task); setEditorOpen(true); }} onStatus={status} onProgressCreate={progressCreate} onProgressUpdate={progressUpdate} onProgressDelete={progressDelete} />
        <NextSection tasks={state.next} onEdit={(task) => { setEditing(task); setEditorOpen(true); }} onStatus={status} />
        <DoneSection tasks={state.done} onStatus={status} />
      </main>
      <NewTaskButton onClick={openNewTaskEditor} />
      {editorOpen && <TaskEditorModal task={editing} goals={state.allGoals} onClose={() => setEditorOpen(false)} onCreateGoal={async (title) => { const goal = await createGoal({ title, status: "active" }); await reloadDeckState(); return goal; }} onSave={async (values) => { if (editing) await updateTask(editing.id, values); else await createTask(values); await reloadDeckState(); }} />}
      {goalManagerOpen && <GoalManagerModal goals={state.allGoals} onClose={() => setGoalManagerOpen(false)} onCreate={async (title) => { await createGoal({ title, status: "future" }); await reloadDeckState(); }} onRename={async (id, title) => { await updateGoal(id, title); await reloadDeckState(); }} onStatus={async (id, status) => { await changeGoalStatus(id, status); await reloadDeckState(); }} getOpenTaskCount={countOpenTasksForGoal} />}
    </div>
  );
};

export default App;
