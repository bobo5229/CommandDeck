import { createGoal, createProgressItem, createTask, isDatabaseEmpty } from "../data/deckRepository";

export async function seedDevelopmentData(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_COMMANDDECK_SEED !== "1" || !(await isDatabaseEmpty())) return;
  const proposal = await createGoal({ title: "完成项目建议书第一部分修改", status: "active" });
  const auralis = await createGoal({ title: "Auralis", status: "active" });
  const now = await createTask({ title: "修改 1.1.2", goalId: proposal.id, status: "active", currentSummary: "正在重新划分 1.1.2 / 1.1.4 职责", nextAction: "重新确定迁移后 1.1.2 的核心职责" });
  await Promise.all([
    createProgressItem({ taskId: now.id, content: "理清导师意见", status: "completed", sortOrder: 0 }), createProgressItem({ taskId: now.id, content: "判断迁移内容", status: "completed", sortOrder: 1 }),
    createProgressItem({ taskId: now.id, content: "补充技术核验", status: "active", sortOrder: 2 }), createProgressItem({ taskId: now.id, content: "重新划分章节职责", status: "active", sortOrder: 3 }),
    createProgressItem({ taskId: now.id, content: "形成候选文字", status: "future", sortOrder: 4 }), createProgressItem({ taskId: now.id, content: "忠实度检查", status: "future", sortOrder: 5 }),
  ]);
  await createTask({ title: "AMDL Select V2", goalId: auralis.id, status: "active", currentSummary: "正在推进当前开发阶段", nextAction: "编写选择器单元测试用例" });
  await createTask({ title: "补写 1.1.4", goalId: proposal.id });
  await createTask({ title: "RoboPack 精读", status: "completed" });
}
