# CommandDeck

CommandDeck 是一个基于 Tauri、React、TypeScript 和 SQLite 的桌面工作台，用 `NOW / NEXT / DONE` 组织当前任务、下一步任务和最近完成的任务。

## 当前功能

- 本地 SQLite 数据存储与首次开发运行的可选演示数据
- 创建、编辑任务，并为任务关联目标（Goal）
- 展开 NOW 卡片查看、添加、编辑和调整进度项
- 通过任务菜单移动状态、完成或跳过任务
- 自定义无边框窗口、窄窗口布局和键盘可操作的菜单

## 开发

需要安装 Node.js、Rust，以及 Tauri 的系统依赖。

```bash
npm install
npm run dev          # 仅启动 Vite 前端
npm run tauri dev    # 启动桌面应用
npm run build        # TypeScript 检查并构建前端产物
```

开发演示数据默认关闭。启动前设置 `VITE_COMMANDDECK_SEED=1`，且本地数据库为空时会写入一组 CommandDeck 示例任务。

## 目录结构

- `src/`：React 界面、组件、样式和本地数据访问层
- `src-tauri/`：Tauri 配置、SQLite migration 和 Rust 入口
- `dist/`：Vite 构建产物（由 `npm run build` 生成）
