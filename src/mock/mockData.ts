import { Goal, ActiveTask, NextTask, DoneTask } from "../types/deck";

export const MOCK_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "完成项目建议书第一部分修改",
    status: "active",
  },
  {
    id: "goal-2",
    title: "完成 CommandDeck 第一版",
    status: "active",
  },
];

export const MOCK_NOW_TASKS: ActiveTask[] = [
  {
    id: "now-1",
    goalLabel: "项目建议书第一部分",
    title: "修改 1.1.2",
    currentSummary: "正在重新划分 1.1.2 / 1.1.4 职责",
    defaultExpanded: true,
    completedItems: [
      "理清导师意见",
      "判断迁移内容",
    ],
    inProgressItems: [
      "补充技术核验",
      "重新划分章节职责",
    ],
    upcomingItems: [
      "形成候选文字",
      "忠实度检查",
    ],
    nextAction: "重新确定迁移后 1.1.2 的核心职责",
  },
  {
    id: "now-2",
    goalLabel: "Auralis",
    title: "AMDL Select V2",
    currentSummary: "正在推进当前开发阶段",
    defaultExpanded: false,
    completedItems: [
      "梳理旧版配置兼容性",
    ],
    inProgressItems: [
      "重构选择器状态管理",
    ],
    upcomingItems: [
      "集成测试回归",
    ],
    nextAction: "编写选择器单元测试用例",
  },
];

export const MOCK_NEXT_TASKS: NextTask[] = [
  {
    id: "next-1",
    title: "补写 1.1.4",
    goalLabel: "项目建议书第一部分",
  },
  {
    id: "next-2",
    title: "Atlas 模型架构整理",
    goalLabel: "论文调研",
  },
  {
    id: "next-3",
    title: "CommandDeck MCP 设计",
    goalLabel: "CommandDeck",
  },
];

export const MOCK_DONE_TASKS: DoneTask[] = [
  {
    id: "done-1",
    title: "RoboPack 精读",
  },
  {
    id: "done-2",
    title: "1.1.1 场景筛选",
  },
  {
    id: "done-3",
    title: "技术栈初步确定",
  },
];
