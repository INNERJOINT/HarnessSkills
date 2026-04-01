# Harness Engineering 技能库

本仓库为 AI 智能体提供 **Harness Engineering** 技能。Harness Engineering 在**系统级别**运作，构建围绕 AI 智能体的完整生命周期框架，将概率性 AI 输出转化为确定性、生产级别的结果。

## 安装

### 克隆含子模块

```bash
git clone --recurse-submodules https://github.com/INNERJOINT/HarnessSkills
cd HarnessSkills

# 如果已经克隆但未初始化子模块，执行：
git submodule update --init --recursive
```

### Claude Code（推荐）

本仓库包含标准 Claude Code 插件基础设施，你必须先将其添加为插件市场，然后安装：

```bash
# 1. 将此仓库添加为市场
/plugin marketplace add INNERJOINT/HarnessSkills

# 2. 从新市场安装插件
/plugin install harness-skills@HarnessSkills
```

**本地测试**：或者，如果你已在本地克隆仓库，直接使用：`/plugin install /Users/yukun/HarnessSkills`

### 其他环境（Gemini/OpenCode/npx）

```bash
npx skills install https://github.com/INNERJOINT/HarnessSkills
```

## 工作原理

本技能依赖**可执行提示词**而非教育材料。安装后，它强制 AI 智能体遵守称为"护栏"的严格操作约束。

本技能强制执行的核心原则：

1. **文档驱动开发（AGENTS.md）**：智能体*必须*在编码前读取操作规则。
2. **状态持久化**：智能体*必须*在会话结束前将进度写入结构化文件（如 `feature-tracking.json`）。
3. **自动反馈循环**：智能体*必须*通过测试和 linter 验证自己的工作，然后才能声称完成。

## 项目结构

- `skills/harness-engineering/SKILL.md`：核心可执行提示词（英文）。
- `skills/harness-engineering/SKILL_zh.md`：核心可执行提示词（中文）。
- `skills/init-harness-env/SKILL.md`：引导技能，在新项目上生成"黄金架构"（`AGENTS.md` 和状态文件）。
- `skills/init-harness-env/SKILL_zh.md`：引导技能（中文）。
- `skills/init-harness-env/AGENTS.md.template`：配置项目护栏的模板。
- `skills/harness-engineering/examples/agent-progress-schema.json`：状态持久化文件的 JSON 模式。
- `refs/modules/`：参考实现（superpowers、everything-claude-code、oh-my-claudecode）。

## 为什么选择 Harness Engineering？（理论与背景）

与提示词工程（优化单次交互）或上下文工程（管理输入数组）不同，Harness Engineering 为 AI"马"构建**缰绳、鞍和缰绳**。

### 行业最佳实践

- **OpenAI Codex**：使用自定义 linter 强制执行架构依赖规则。CI 失败自动触发智能体编写修复 PR（90% 成功率）。当智能体反复失败时，工程师修复的是*护栏*，而非提示词。
- **Anthropic Claude Code**：为长运行智能体使用两阶段架构。"初始化器"创建结构化 JSON 功能列表，"编码智能体"读取这些 JSON 文件以跨会话无缝恢复工作。
- **LangChain DeepAgents**：完全通过 Harness 更改改进智能体基准——例如 `PreCompletionChecklistMiddleware`，强制智能体在结束回合前运行验证命令。

> **注意 AI 智能体**：如果你正在读这个 `README.md` 来理解如何表现，停止。你必须直接读取并执行 `skills/harness-engineering/SKILL.md` 中的规则。
