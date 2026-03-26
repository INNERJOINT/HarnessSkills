**Anthropic 支持“长时任务智能体（long-running agents）”的核心实现方法，是通过 **Claude Agent SDK / Claude Code** 配合专门设计的 **Agent Harness（智能体脚手架）** 来实现的。**

这套方法主要解决**离散会话（discrete sessions）+ 有限上下文窗口**带来的记忆丢失问题，让智能体能跨数小时甚至多天、数百个 context window 持续可靠地工作（例如构建完整应用、科学计算任务等）。官方最核心的公开文档是 2025 年 11 月 26 日发布的《Effective harnesses for long-running agents》，后续又在 2026 年 3 月的《Harness design for long-running application development》中进一步演进为更复杂的三代理架构。

### 1. 核心问题
- 智能体每次新 session 都是**全新上下文**，没有先前记忆。
- 复杂任务无法在单个 context window 内完成，容易出现：
  - “one-shot” 试图一次性做完 → 半成品、bug 堆积。
  - 过早宣布任务完成。
  - 花费大量 token 猜测历史状态。
- 即使 Claude Agent SDK 自带 **automatic compaction（自动压缩历史）**，单纯依赖上下文仍不够可靠。

### 2. 基础实现：Initializer + Coding Agent（两阶段架构）
Anthropic 借鉴**人类工程师轮班协作**的做法，设计了“**结构化交接 artifacts**”来实现跨 session 记忆持久化。

- **Initializer Agent（初始化智能体）**  
  仅在**首次运行**时激活，负责搭建完整工作环境：
  - 生成 `feature_list.json`（结构化功能清单，每项包含 description、steps、passes 状态）。
  - 创建 `claude-progress.txt`（进度日志）。
  - 写入 `init.sh`（启动服务器、环境初始化脚本）。
  - 初始化 git 仓库并提交初始状态。
  - 示例 feature_list.json 片段：
    ```json
    {
      "category": "functional",
      "description": "New chat button creates a fresh conversation",
      "steps": [ ... ],
      "passes": false
    }
    ```

- **Coding Agent（编码/主智能体）**  
  后续每个 session 的主力：
  1. 读取 `claude-progress.txt` + git log + feature_list.json，了解当前状态。
  2. 运行 `init.sh` 启动环境 + 基础测试（确保 clean state）。
  3. **每次只挑一个未完成 feature** 增量实现（避免一次性做太多）。
  4. 编写代码 → 运行端到端测试（Puppeteer / Playwright MCP 模拟浏览器点击）。
  5. 更新 feature_list.json（仅修改 passes 字段）、git commit、更新进度日志。
  6. 确保项目处于**可直接继续的干净状态**后结束 session。

这样，每个新 session 都能像新来的工程师一样“快速上手”，无需重新推导历史。

**快速上手代码**：Anthropic 官方 GitHub quickstart 已提供完整示例  
→ https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding

### 3. 高级演进：三代理架构（Planner + Generator + Evaluator）
2026 年 3 月的 harness 进一步升级，专门解决“context anxiety（上下文焦虑）”和“自我评价过于宽松”两大顽疾：

| 代理角色     | 职责                              | 关键技巧 |
|--------------|-----------------------------------|----------|
| **Planner**  | 把 1–4 句用户提示扩展成详细产品规格 | 避免过早细节化 |
| **Generator**| 增量实现功能（可谈判 sprint contract） | 编写代码、提交 git |
| **Evaluator**| 使用 Playwright 真实交互测试 + 打分 | 独立批判，输出详细 bug 清单 |

- 三个代理通过**文件系统**异步通信（读写 artifacts），形成类似 GAN 的生成-评估循环。
- 早期用 **context reset**（清空上下文 + 结构化 handoff）缓解 Sonnet 4.5 的焦虑；Opus 4.5/4.6 后可直接用 SDK 的 compaction 实现长连续 session。
- 效果：6 小时内可构建出功能完整、UI 精美的全栈应用（远超单次生成）。

### 4. 通用支撑技术（API 层面）
- **Prompt Caching**：重复的系统提示、工具定义等自动缓存，大幅降低长任务成本。
- **Automatic Compaction**：SDK 自动总结历史，保持上下文在窗口内。
- **Persistent Artifacts**：文件系统（JSON、Git、CHANGELOG.md、CLAUDE.md）作为“长期记忆”，不受上下文限制。
- **Test Oracles + Ralph Loop**：在科学计算等场景中，用参考实现做验证器 + 持续迭代直到达标。

### 5. 总结与适用场景
Anthropic 的实现哲学是：**模型能力重要，但 Harness（脚手架）更重要**。他们把“让智能体像人类工程师一样工作”做到了极致——**feature-by-feature、清晰文档、干净交接**。这套方法已成功用于：
- 全栈应用开发（claude.ai 克隆、DAW、游戏编辑器）
- 科学计算（多日 Boltzmann 求解器）
- 其他需要长时间自主迭代的任务

想自己实现的话，推荐直接 fork 官方 quickstart + 参考两篇博客的提示词模板即可快速跑通。后续随着 Claude 模型上下文能力和规划能力的提升，harness 还会继续简化，但“结构化 artifacts + 增量工作”的核心思路不会变。

官方博客原文（强烈推荐阅读）：
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://www.anthropic.com/engineering/harness-design-long-running-apps
