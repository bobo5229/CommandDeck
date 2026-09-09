import { createGoal, createProgressItem, createTask, isDatabaseEmpty } from "../data/deckRepository";

const seedFailureMarker = "commanddeck.development-seed-failed";
let developmentSeedPromise: Promise<void> | undefined;

export function seedDevelopmentData(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_COMMANDDECK_SEED !== "1") return Promise.resolve();

  developmentSeedPromise ??= seedDevelopmentDataOnce();
  return developmentSeedPromise;
}

async function seedDevelopmentDataOnce(): Promise<void> {

  const empty = await isDatabaseEmpty();
  if (localStorage.getItem(seedFailureMarker)) {
    if (!empty) {
      const message = "Development seed previously failed and may have left partial data. Clear the development database before retrying.";
      console.error(message);
      throw new Error(message);
    }
    localStorage.removeItem(seedFailureMarker);
  }
  if (!empty) return;

  localStorage.setItem(seedFailureMarker, "1");
  try {
    const commandDeck = await createGoal({ title: "CommandDeck", status: "active" });
    const now = await createTask({
      title: "优化 CommandDeck UI",
      goalId: commandDeck.id,
      status: "active",
      currentSummary: "正在将主界面调整为 Editorial Desktop Command Center",
      nextAction: "检查 NOW Card 在 430px 窗口中的真实扫描体验",
    });
    await Promise.all([
      createProgressItem({ taskId: now.id, content: "Phase 1 视觉方向", status: "completed", sortOrder: 0 }),
      createProgressItem({ taskId: now.id, content: "Phase 2 Editorial Shell", status: "completed", sortOrder: 1 }),
      createProgressItem({ taskId: now.id, content: "NOW Card 视觉验收", status: "active", sortOrder: 2 }),
      createProgressItem({ taskId: now.id, content: "ProgressItem 信息层级检查", status: "active", sortOrder: 3 }),
      createProgressItem({ taskId: now.id, content: "NEXT / DONE 最终优化", status: "future", sortOrder: 4 }),
      createProgressItem({ taskId: now.id, content: "整体密度校准", status: "future", sortOrder: 5 }),
    ]);
    localStorage.removeItem(seedFailureMarker);
  } catch (error) {
    console.error("Development seed failed. The database may contain partial data; clear it before retrying.", error);
    throw error;
  }
}
