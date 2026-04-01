截至 **2026 年 3 月**，从 Anthropic 的官方工程文章和文档来看，它支持“长时任务智能体（long-running agents）”并不是靠单一能力，而是靠一套 **agent harness / scaffold（智能体外层执行框架）**：把模型、工具、上下文管理、持久化记忆、测试反馈、恢复机制和多智能体编排组合在一起。Anthropic 自己也明确把 Claude Code / Agent SDK 视为这种 harness 的核心基础，而不是把“agent”仅仅理解成一次对话调用。([Anthropic][1])

你可以把 Anthropic 的实现方法概括成 8 个层次：

### 1) 用 **Agent harness** 把模型包成一个可持续运行的循环

Anthropic 的表述里，agent harness 负责处理输入、编排工具调用、维护执行循环并返回结果；他们还用 Agent SDK 来构建长时 agent 的外层框架。也就是说，真正支撑 long-running agent 的不是“模型自动跑很久”，而是一个持续迭代的执行器。([Anthropic][1])

### 2) 用 **context management** 解决长会话的上下文膨胀

Anthropic 在官方文档中把 **Compaction、Context editing、Prompt caching** 明确列为长会话上下文管理能力；其中 compaction 是在上下文快到上限时，对早期对话做高保真总结，再继续新窗口，目的是让 agent 能长期保持连贯性。Anthropic 还专门提到，长时任务里光靠更大的上下文窗口并不够，因为还会有 context pollution（上下文污染）和信息相关性衰减问题。([Claude API Docs][2])

更细一点说，Anthropic 给出的 3 个核心手段是：**compaction、structured note-taking、multi-agent architectures**。此外，它还建议做更轻量的上下文清理，例如清掉过深历史里的 tool results，以降低无关噪声。([Anthropic][3])

### 3) 把“长期记忆”放到 **上下文窗口外**

Anthropic 非常强调 **structured note-taking / agentic memory**。它的实践不是让模型把一切都记在对话里，而是让 agent 持续把关键状态写到外部文件，例如 `CHANGELOG.md`、`NOTES.md`、`claude-progress.txt` 这类工件；下一轮再把这些内容拉回上下文。Anthropic 在科研 long-running 场景中把 `CHANGELOG.md` 直接称为 portable long-term memory，并强调要记录当前状态、已完成事项、失败路径、关键指标和已知限制。([Anthropic][3])

Anthropic 特别强调：**失败过的方法最重要**，因为如果不记录，后续 session 很容易重复踩同一个坑。([Anthropic][4])

### 4) 不让 agent 一次做完全部，而是 **拆任务、分阶段推进**

Anthropic 发现，长时 agent 的一个典型失败模式是试图“一次性做完”，结果中途耗尽上下文，下一轮又接不上。为此，他们在较早的 long-running harness 里用了 **initializer agent + coding agent**：

* initializer 先初始化环境、生成 `init.sh`、进度文件、初始 git commit；
* coding agent 后续只做增量推进，并留下结构化更新。([Anthropic][5])

更关键的是，Anthropic 明确说 **one feature at a time** 是关键做法：让 coding agent 每次只挑一个 feature 做，而不是整包硬上。([Anthropic][5])

在 2026 年更新的应用开发 harness 里，Anthropic 又把它升级成 **三智能体结构：planner / generator / evaluator**：

* **Planner**：把用户的简短 prompt 扩展成完整产品规格；
* **Generator**：按 sprint 一次拿一个 feature 开发；
* **Evaluator**：定义和验证“done”的标准。([Anthropic][6])

其中一个很重要的点是 **sprint contract**：在写代码前，generator 和 evaluator 先约定这轮要交付什么、如何验证完成。这个步骤实际上是在把“高层需求”桥接成“可测试的局部目标”。([Anthropic][6])

### 5) 用 **test oracle** 让 agent 知道自己是否在前进

Anthropic 明确提出，long-running autonomous work 必须有 **test oracle**，否则 agent 很难判断自己是在取得进展还是在原地打转。这个 oracle 可以是参考实现、可量化目标，或者现成测试集；他们还建议 agent 一边工作一边扩展测试，避免回归。([Anthropic][4])

这其实是 Anthropic 长时 agent 的一个核心思想：
不是“让模型自由发挥很久”，而是“让模型在持续反馈回路里很久地工作”。([Anthropic][4])

### 6) 用 **Git、checkpoint、retry、resume** 保证可恢复执行

Anthropic 在多智能体研究系统里提到，长时 agent 是 stateful 的，而且错误会累积；因此工程上必须能 **durably execute**，并在故障后 **resume from where the agent was**，不能每次都从头再来。为此他们结合了 **retry logic、regular checkpoints** 和模型本身的适应能力。([Anthropic][7])

在更具体的实践里，Anthropic 建议 agent 对每个有意义的工作单元都 **commit and push**。这样既能保留可恢复历史，也能防止计算资源中断导致成果丢失。([Anthropic][4])

所以从实现角度看，Anthropic 的 long-running agent 不是“连续思考 48 小时”，而是：
**持续工作 + 持续落盘 + 持续可回滚 + 出错可续跑**。([Anthropic][7])

### 7) 允许 **后台运行 + 人类中途转向**

Anthropic 在科研场景里建议把 Claude Code 放到 `tmux` 这类终端复用器里运行，甚至在 HPC / SLURM 环境里跑，这样你可以断开电脑，过一段时间再回来检查和接管。([Anthropic][4])

同时，他们还提供了 **hooks** 机制。官方 hooks 文档明确说，对于部署、测试套件、外部 API 调用这类长时间动作，可以把 hook 配成 `"async": true`，让它在后台跑，而 Claude 继续前进。([Claude API Docs][8])

Anthropic 还给出一个很实用的 steering 模式：用 `PostToolUse` hook 去拉取仓库里的 `STEERING.md`，把新的人工指令注入 Claude 的上下文，从而实现“不中断会话的中途纠偏”。([Anthropic][4])

### 8) 用 **多智能体 / 子智能体** 隔离上下文和并行探索

Anthropic 在 context engineering 文里明确说，**sub-agent architectures** 是绕开上下文限制的重要方法：主 agent 负责总计划，子 agent 在干净上下文里深入探索，最后只回传精炼摘要。每个子 agent 可以消耗大量 token，但主 agent 只接收 1000–2000 token 级别的蒸馏结果。Anthropic 认为这种模式在复杂研究任务上明显优于单智能体。([Anthropic][3])

这也是为什么 Anthropic 的更新版 harness 会出现 planner / generator / evaluator 这种角色分工：
本质上是在做 **上下文隔离 + 职责分离 + 结果蒸馏**。([Anthropic][6])

---

## Anthropic 这套方法，压缩成一句话

Anthropic 支持 long-running agents 的方法，可以概括为：

**持续运行的 agent loop + 自动上下文压缩 + 外部持久化记忆 + 增量式任务分解 + 测试驱动反馈 + Git/检查点恢复 + 后台执行与人工转向 + 多智能体分工。** ([Anthropic][5])

---

## 如果你要仿 Anthropic，自建一个最小可用 long-running agent

可以按这个骨架来做：

1. **主控 loop**
   用户任务 → planner 生成 spec / task list → generator 选一个最小任务执行 → evaluator 验证 → 写入记忆文件 → commit/checkpoint → 进入下一轮。

2. **记忆层**
   维护 `CLAUDE.md` 或 `AGENT.md` 作为长期规则，维护 `CHANGELOG.md` / `NOTES.md` 作为运行时记忆，强制记录失败尝试和下一步。这个模式与 Anthropic 官方建议高度一致。([Anthropic][4])

3. **验证层**
   每轮必须有 done condition：测试通过、指标提升、页面功能可验证，或和 reference implementation 对齐。([Anthropic][4])

4. **恢复层**
   每轮都保存工件、commit、checkpoint；工具失败时把错误显式回传给 agent，让它自适应；系统层做 retry/resume。([Anthropic][7])

5. **上下文层**
   不把所有历史原样喂回模型；做 compaction、清理旧 tool results、只回注与当前 sprint 有关的记忆。([Anthropic][3])

下面是一个非常贴近 Anthropic 思路的伪代码：

```python
while not goal_reached:
    compact_context_if_needed()
    load(["CLAUDE.md", "CHANGELOG.md", "TASKS.json"])

    sprint = planner_or_selector.pick_next_feature()
    contract = evaluator.define_done(sprint)

    result = generator.run_tools_and_edit_code(sprint, contract)

    test_report = run_tests_or_oracle(contract)
    memory.write_update(
        current_status=result.status,
        completed=result.completed,
        failed_attempts=result.failed_paths,
        next_steps=result.next_steps,
    )

    if test_report.pass:
        git.commit_and_push()
    else:
        checkpoint()
        maybe_retry_or_replan()

    if external_steering_exists("STEERING.md"):
        inject_new_instructions()
```

---

## 哪些是“Anthropic 平台能力”，哪些是“工程方法”？

这两类要分开看：

**平台能力** 更偏基础设施：

* Agent SDK / Claude Code
* Compaction
* Context editing
* Prompt caching
* Bash tool
* Hooks / async hooks
  这些是官方提供的构件。([Claude API Docs][2])

**工程方法** 更偏 Anthropic 的内部实践：

* initializer / planner / generator / evaluator
* one-feature-at-a-time
* progress file / notes file
* test oracle
* git as coordination
* retry + checkpoints + resume
  这些更像是 Anthropic 已验证有效的 scaffold 设计模式。([Anthropic][5])

---

## 一个容易误解的点

Anthropic 现在的方向并不是“只靠更长上下文窗口解决长时任务”。他们公开写得很清楚：哪怕上下文窗口更大，长时任务仍然会遇到 context pollution 和 relevance 问题，所以重点变成 **context engineering**，也就是怎样选择、压缩、外存和重注入信息。([Anthropic][3])


[1]: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents "Demystifying evals for AI agents \ Anthropic"
[2]: https://docs.anthropic.com/en/docs/build-with-claude/overview "Features overview - Claude API Docs"
[3]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents "Effective context engineering for AI agents \ Anthropic"
[4]: https://www.anthropic.com/research/long-running-tasks "Long-Running Claude for Scientific Research \ Anthropic"
[5]: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents "Effective harnesses for long-running agents \ Anthropic"
[6]: https://www.anthropic.com/engineering/harness-design-long-running-apps "Harness design for long-running application development \ Anthropic"
[7]: https://www.anthropic.com/engineering/multi-agent-research-system "How we built our multi-agent research system \ Anthropic"
[8]: https://docs.anthropic.com/en/docs/claude-code/hooks "Hooks reference - Claude Code Docs"
