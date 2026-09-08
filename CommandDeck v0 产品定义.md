# CommandDeck v0 产品定义

## 1. 产品定位

CommandDeck 是一个 Windows 桌面端的个人工作指挥台。

它面向这样一种工作方式：用户同时借助多个 AI Agent 推进不同事项，自己作为 Commander 负责决定目标、确认任务状态、选择下一步推进方向。

CommandDeck 的目的不是替用户执行任务，也不是内置一个 Agent，而是帮助用户持续掌握：

- 当前正在推进什么；
- 每件正在推进的事情目前做到哪里；
- 未来还需要推进什么；
- 最近已经完成了什么；
- 当前这些任务分别服务于什么 Goal。

应用本身不包含 Agent 或 Agent Harness。

外部 Agent 可以通过 MCP 接口读取和操作 CommandDeck 中的 Goal、Task 及相关状态。

---

## 2. 核心对象

CommandDeck 当前只定义两个核心层级：

```text
Goal
└── Task
```

### Goal

Goal 表示一个相对长期、面向结果的工作目标。

例如：

```text
Goal：
完成项目建议书第一部分修改
```

Goal 自身有状态，但在主界面中不作为主要视觉对象。

Goal 的主要作用是为 Task 提供工作上下文。

### Task

Task 表示为了推进某个 Goal 而需要完成的一项具体工作。

例如：

```text
Goal：
完成项目建议书第一部分修改

Task：
修改 1.1.2
```

Task 是 CommandDeck UI 中最主要的信息对象。

---

## 3. Goal 与 Task 状态

Goal 和 Task 都具有状态。

当前暂定：

```text
Goal
- future
- active
- completed
- archived
```

```text
Task
- future
- active
- completed
- skipped
```

Task 的状态在 UI 中具有更高视觉优先级。

Goal 状态主要作为辅助信息存在。

Goal 是否完成，不应仅根据其下 Task 自动推导，最终状态由用户确认。

---

## 4. 主界面组织方式

主界面采用“状态优先”，而不是“Goal 优先”。

也就是说，用户首先看到：

```text
NOW
当前正在推进的 Task

NEXT
未来需要推进的 Task

DONE
最近已经完成的 Task
```

Task 所属 Goal 以弱化标签形式展示。

例如：

```text
NOW

[项目建议书第一部分]
修改 1.1.2

[CommandDeck]
设计 Overlay UI
```

而不是先进入某个 Goal，再查看该 Goal 下的 Task。

---

## 5. Task 当前进度信息

Active Task 需要支持一个独立字段：

```text
current_summary
```

它用于回答：

> 这件事情现在推进到哪里了？

例如：

```text
Task：
修改 1.1.2

current_summary：
正在重新划分 1.1.2 与 1.1.4 的职责边界
```

该字段由用户维护。

用户也可以要求外部 Agent 根据当前工作上下文生成或更新该字段，并通过 MCP 写入 CommandDeck。

CommandDeck 本身不自动生成该内容。

---

## 6. 下一步动作

Task 可以包含：

```text
next_action
```

它用于回答：

> 当我重新回到这个 Task 时，下一步应该做什么？

例如：

```text
current_summary：
已确认部分内容需要迁移至 1.1.4

next_action：
重新确定迁移后 1.1.2 应保留的职责
```

Overlay 默认状态下不一定需要同时显示 `current_summary` 和 `next_action`。

`current_summary` 优先展示。

`next_action` 可以在展开 Task 后查看。

---

## 7. Task 的细化内容

Future Task 在真正开始推进之前，不要求提前进行详细拆解。

只有 Task 进入 Active 后，用户才根据实际情况对它进行细化。

这些细化内容：

- 可以是一个较大的工作阶段；
- 可以是一项非常具体的动作；
- 不要求严格线性推进；
- 可以存在多个同时进行中的项；
- 可以动态插入、修改和重新排序。

因此当前不将它们正式命名为严格意义上的 Stage。

具体的数据模型名称在开发前可以进一步确定。

---

## 8. 补录已经开始的 Task

CommandDeck 必须支持一种现实情况：

用户已经开始推进某项工作，甚至已经完成了若干阶段，之后才意识到应该将其加入 CommandDeck。

因此创建 Active Task 时，应允许直接补录：

- 已经完成的细化项；
- 当前正在推进的细化项；
- 未来可能需要推进的细化项；
- 当前进度摘要；
- 下一步动作。

系统不能假设所有 Task 都是“先创建，再开始”。

---

## 9. Goal 的展示

如果屏幕空间允许，Overlay 中可以显示当前 Goal。

Goal 的作用类似 Harness 中的 `/goal`：

它不是一个需要立即勾选的 Todo，而是告诉用户：

> 当前这些任务最终服务于什么方向。

Goal 在 UI 中的视觉权重低于 NOW 和 NEXT。

建议总体优先级为：

```text
NOW > NEXT > GOAL > DONE
```

如果空间不足，Goal 可以折叠或弱化。

---

## 10. Overlay 主界面

CommandDeck 的核心形态不是传统 Todo 应用窗口，而是一个能够长期存在于桌面上的工作状态层。

Overlay 状态下，用户扫一眼应该能够看到：

- 当前正在推进的事项；
- 每个事项当前推进到哪里；
- 未来需要推进的事项；
- 最近已经完成的事项；
- 如果空间足够，当前 Goal。

Active Task 默认只显示当前推进信息。

用户可以展开 Task，查看更完整的过去推进内容和未来推进内容。

---

## 11. 窗口模式

CommandDeck 需要至少支持以下窗口行为：

### Overlay Mode

用于长期常驻桌面。

特征：

- 始终置顶；
- 覆盖在其他应用上方；
- 不改变其他窗口布局；
- 可以贴靠屏幕边缘；
- 适合扫一眼和快速操作。

### Pinned Window Mode

完整窗口，但保持始终置顶。

用于需要更多空间，同时仍希望 CommandDeck 保持可见的场景。

### Normal Window Mode

表现为普通 Windows 桌面窗口。

用于：

- 集中整理大量 Task；
- 编辑 Goal；
- 修改较复杂的细化内容；
- 查看历史信息。

三种模式尽量共享同一套 UI 和数据状态，只改变窗口行为和信息密度。

---

## 12. 多显示器与 DPI

CommandDeck 当前只考虑 Windows。

主要使用环境包括：

- 2560 × 1600 显示器；
- 3840 × 2160 4K 显示器；
- 4K 显示器使用 150% Windows 缩放。

因此窗口设计必须考虑：

- Per-monitor DPI；
- 不同缩放比例之间拖动窗口；
- 高 DPI 文本清晰度；
- 窗口位置记忆；
- 贴边位置在不同屏幕下保持正确。

UI 尺寸应使用逻辑尺寸，而不是依赖物理像素。

---

## 13. Agent 与 MCP

CommandDeck 本身不包含：

- LLM；
- Agent；
- Agent Harness；
- Prompt orchestration。

CommandDeck 只负责：

- 本地状态存储；
- UI 展示；
- 用户操作；
- 对外暴露稳定的 MCP 接口。

外部 Agent 负责：

- 帮助用户生成 Goal；
- 帮助用户创建 Task；
- 将复杂工作拆成细化项；
- 根据当前会话总结 `current_summary`；
- 生成 `next_action`；
- 根据用户指令更新任务状态。

最终任务状态仍然属于 CommandDeck。

CommandDeck 是工作状态的单一真源。

---

## 14. 技术方向

当前技术基线：

```text
Tauri 2
React
TypeScript
Vite
SQLite
MCP
```

当前只考虑 Windows，不追求跨平台和跨设备同步。

选择 Web UI 技术的主要原因是：

- UI 迭代速度高；
- CSS 视觉自由度高；
- React 组件化适合卡片、折叠和动态布局；
- 更适合通过 Codex、Antigravity 等 Agent 进行持续 vibe coding。

Tauri 负责桌面壳和 Windows 系统能力。

---

## 15. 当前明确不做的事情

v0 产品定义阶段暂不考虑：

- 云同步；
- 账号系统；
- 多人协作；
- 移动端；
- Web 版；
- 应用内部 AI 助手；
- 自动监控 ChatGPT、Claude、Codex 等 Agent 是否已经回复；
- 自动判断用户是否完成某项工作；
- 自动替用户推进任务状态；
- 复杂项目管理能力；
- 甘特图；
- 复杂依赖图。

这些内容以后只有在真实使用中证明有必要时再讨论。

---

## 16. CommandDeck 的核心原则

CommandDeck 不是为了替用户管理人生，也不是为了自动规划所有工作。

它解决的是一个更加具体的问题：

> 当一个人作为 Commander，同时借助多个 Agent 推进大量不同工作时，如何用一个始终可见、维护成本很低的桌面指挥台，持续知道自己现在正在推进什么、做到哪里、下一步是什么，以及后面还有什么事情等待推进。

Agent 的作用是降低维护这套工作状态的成本。

CommandDeck 的作用是保存并展示这套工作状态。
