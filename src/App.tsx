import React, { useEffect, useState } from "react";
import "./App.css";
import { Header } from "./components/Header";
import { GoalsSection } from "./components/GoalsSection";
import { NowSection } from "./components/NowSection";
import { NextSection } from "./components/NextSection";
import { DoneSection } from "./components/DoneSection";
import { NewTaskButton } from "./components/NewTaskButton";
import { listActiveGoals, listNextTasks, listNowTasks, listRecentDoneTasks } from "./data/deckRepository";
import { seedDevelopmentData } from "./mock/mockData";
import type { Goal, TaskDetails, TaskWithGoal } from "./types/deck";

export const App: React.FC = () => {
  const [state, setState] = useState<{ goals: Goal[]; now: TaskDetails[]; next: TaskWithGoal[]; done: TaskWithGoal[] }>({ goals: [], now: [], next: [], done: [] });
  const [error, setError] = useState(false);
  useEffect(() => { void (async () => { try { await seedDevelopmentData(); const [goals, now, next, done] = await Promise.all([listActiveGoals(), listNowTasks(), listNextTasks(), listRecentDoneTasks()]); setState({ goals, now, next, done }); } catch (reason) { console.error("Failed to load CommandDeck data", reason); setError(true); } })(); }, []);
  return (
    <div className="deck-app-container">
      <Header />
      <main className="deck-scroll-area">
        {error && <p className="deck-empty-state">无法加载本地数据。</p>}
        <GoalsSection goals={state.goals} />
        <NowSection tasks={state.now} />
        <NextSection tasks={state.next} />
        <DoneSection tasks={state.done} />
      </main>
      <NewTaskButton />
    </div>
  );
};

export default App;
