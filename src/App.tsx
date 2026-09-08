import React from "react";
import "./App.css";
import { Header } from "./components/Header";
import { GoalsSection } from "./components/GoalsSection";
import { NowSection } from "./components/NowSection";
import { NextSection } from "./components/NextSection";
import { DoneSection } from "./components/DoneSection";
import { NewTaskButton } from "./components/NewTaskButton";
import {
  MOCK_GOALS,
  MOCK_NOW_TASKS,
  MOCK_NEXT_TASKS,
  MOCK_DONE_TASKS,
} from "./mock/mockData";

export const App: React.FC = () => {
  return (
    <div className="deck-app-container">
      <Header />
      <main className="deck-scroll-area">
        <GoalsSection goals={MOCK_GOALS} />
        <NowSection tasks={MOCK_NOW_TASKS} />
        <NextSection tasks={MOCK_NEXT_TASKS} />
        <DoneSection tasks={MOCK_DONE_TASKS} />
      </main>
      <NewTaskButton />
    </div>
  );
};

export default App;
