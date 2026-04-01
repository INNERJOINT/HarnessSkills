# OMC Hooks 机制移植 HarnessSkills 详细计划

## 1. OMC Hooks 机制全景解析

Oh-My-ClaudeCode (OMC) 的钩子机制远超简单的 Bash 脚本调用，它通过一系列 Node.js 封装，实现了一个**稳定的跨平台事件路由器**和**带状态的生命周期拦截器**。其核心机制如下：

1. **底层派发器 (`run.cjs`)**：
   - 解决跨平台问题：不再依赖系统的 `sh` 或配置各种 `$PATH`，而是使用 `process.execPath` 直接调用当前启动 Claude 的内置 Node 引擎。
   - 解决版本漂移：针对 Claude Code 缓存刷新后 `CLAUDE_PLUGIN_ROOT` 变老或变成失效 Symlink 的问题，`run.cjs` 内置了 `realpath` 和降级搜索算法，保证 Hook 永远能精准定位到对应的执行脚本。
2. **标准输入/输出协议 (`Stdin/Stdout`)**：
   - Claude 会在如 `UserPromptSubmit` 或 `PreToolUse` 等高阶事件中，通过操作系统的标准输入（`stdin`）向 Hook 灌入 JSON（如用户的输入文本、试图调用的工具名）。
   - Hook 脚本 (`.mjs`) 必须非阻塞地读完输入，处理逻辑，然后把包含 `hookSpecificOutput` 的 JSON 格式严格地 `console.log` 回标准输出。
3. **状态机共享 (`.omc/state/`)**：
   - 由于各个 Hook 进程是无状态且独立的，OMC 将诸如 `.omc/state/ralph-state.json` 或记录 Agent 数量的追踪文件写在硬盘上，作为所有 Hook 共享的"中央数据库"。

---

## 2. 移植到 HarnessSkills 的实施计划 (4 个阶段)

我们将该机制重构至你的 `HarnessSkills`，使其具备与 OMC 同等级别的健壮性和可扩展性。

### Phase 1: 基础设施搭建 (The Foundation)
第一步，先构建底层 Dispatcher，接管从 Claude Code 抛出来的所有事件。

- [ ] **创建 Runner 脚本**
  - 路径：`scripts/run.cjs`
  - 动作：复制并精简 OMC 的 `run.cjs` 逻辑。让它只做两件事：(1) 解析传入的 `.mjs` 模块名，(2) 用 `spawnSync` 发起执行，把环境和退出码透明透传。
- [ ] **构建 IO 与状态管理库**
  - 路径：`scripts/lib/io.mjs`, `scripts/lib/state.mjs`
  - 动作：编写能正确吃进 `stdin` 流并解析的工具函数；编写在 `.harness/state/` 目录下读写 JSON 配置的管理类。
- [ ] **注册 Hooks 配置**
  - 路径：`hooks/hooks.json`
  - 动作：初始化文件，将 `SessionStart`、`PreToolUse` 和 `UserPromptSubmit` 指向我们的 `run.cjs`。

### Phase 2: 会话初始化与恢复能力 (Session Initialization)
移植 OMC 中负责维护长期记忆和状态恢复的核心。

- [ ] **创建 Session Start 钩子**
  - 路径：`scripts/hooks/session-start.mjs`
  - 逻辑：读取环境变量 `$CLAUDE_SESSION_ID`，在 `.harness/state/` 中寻找是否有属于该 session 的挂起状态。如果有，通过 `hookSpecificOutput.additionalContext` 拼入"恢复工作"的上下文日志。
  - 特性：在这里顺带扫描用户的 `HarnessSkills` 开发规范，将核心规范当做 System Prompt 强行塞入。

### Phase 3: 提示词拦截与工具拦截 (Routing & Guards)
构建类似 OMC 的工作模式切换和防爆机制。

- [ ] **创建 Prompt 拦截器**
  - 路径：`scripts/hooks/prompt-handler.mjs` (响应 `UserPromptSubmit`)
  - 逻辑：读入用户输入的字符串。写点简单的正则（比如匹配 "harness_audit", "harness_tdd"），一旦命中，向传出 JSON 的 `prompt` 字段里静默追加长串的规则 XML，强行把模型切换到极严格的工程模式。
- [ ] **创建 PreToolUse 执行守卫**
  - 路径：`scripts/hooks/pre-tool-enforcer.mjs`
  - 逻辑：如果探测到模型要使用 `Bash` 打包或者运行危险命令，在返回的上下文中插入强制提醒（类似 Superpowers 的 Verification Before Completion）。
  - 进阶：获取 `contextPercent`，高于 75% 时抛出 `decision: "block"` 的阻断信号。

### Phase 4: 长期任务的状态收口 (Persistence)
让智能体关机后记忆不丢失。

- [ ] **创建 Stop/SessionEnd 钩子**
  - 路径：`scripts/hooks/session-stop.mjs`
  - 逻辑：利用此 Hook 在控制台程序关闭时获得最后一次执行权，遍历当前目录的 `claude-progress.txt` 或相关的 TODO 文件，序列化汇总写入 `.harness/state/` 的断点文件中。

---

## 3. 后续工作目录预结构

完成该计划后，你的 HarnessSkills 目录预期如下：
```text
/Users/yukun/HarnessSkills/
├── .hardness/
│   ├── plan/
│   │   └── omc_migration_plan.md   # 本文件
│   └── state/                      # 替代 .omc/state/，存放各 session 断点
├── hooks/
│   └── hooks.json                  # 全局注册路由表
├── scripts/
│   ├── run.cjs                     # 派发器核心
│   ├── lib/
│   │   ├── io.mjs                  # Stdin/Stdout 输入输出封装
│   │   └── state-manager.mjs       # KV 状态管理机制
│   └── hooks/
│       ├── session-start.mjs
│       ├── prompt-handler.mjs
│       └── pre-tool-enforcer.mjs
```
