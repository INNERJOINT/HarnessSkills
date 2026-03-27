# Harness Engineering Skill

This repository provides **Harness Engineering** skills for AI agents. Harness Engineering operates at the **system level**, building the complete lifecycle framework surrounding AI agents to transform probabilistic AI outputs into deterministic, production-grade results.

## Installation

### Claude Code (Recommended)
Since this repository includes standard Claude Code plugin infrastructure, you can install it directly inside Claude Code:

```bash
/plugin install https://github.com/INNERJOINT/HarnessSkills
```

### Other Environments (Gemini/OpenCode/npx)
```bash
npx skills install https://github.com/INNERJOINT/HarnessSkills
```

## How It Works

This skill relies on **executable prompts** rather than educational material. Once installed, it forces the AI agent to obey strict operational constraints called "Guardrails".

The core principles enforced by this skill are:
1. **Document-Driven Development (AGENTS.md)**: The agent *must* read operational rules before coding.
2. **State Persistence**: The agent *must* write its progress to a structured file (e.g., `feature-tracking.json`) before ending a session.
3. **Automated Feedback Loops**: The agent *must* verify its own work through tests and linters before claiming completion.

## Project Structure

- `skills/harness-engineering/SKILL.md`: The core executable prompt (English).
- `skills/harness-engineering/SKILL_zh.md`: The core executable prompt (Chinese).
- `skills/init-harness-env/SKILL.md`: Bootstrap skill to generate the "Golden Architecture" (`AGENTS.md` and state files) on new projects.
- `skills/init-harness-env/SKILL_zh.md`: Bootstrap skill (Chinese).
- `skills/init-harness-env/AGENTS.md.template`: A template for configuring your project's guardrails.
- `skills/harness-engineering/examples/agent-progress-schema.json`: JSON schema for the state persistence file.

## Why Harness Engineering? (Theory & Background)

Unlike Prompt Engineering (optimizing single interactions) or Context Engineering (managing input arrays), Harness Engineering constructs the **bridle, saddle, and reins** for the AI "horse". 

### Industry Best Practices

- **OpenAI Codex**: Used custom linters to enforce architecture dependency rules. CI failures automatically triggered the agent to write a fix PR (90% success rate). When the agent failed repeatedly, engineers fixed the *Harness*, not the prompt.
- **Anthropic Claude Code**: Uses a two-phase architecture for long-running agents. An "Initializer" creates structured JSON feature lists, and a "Coding Agent" reads those JSON files to resume work seamlessly across sessions.
- **LangChain DeepAgents**: Improved agent benchmarks entirely through Harness changes—such as `PreCompletionChecklistMiddleware` that forces agents to run verification commands before ending their turn.

> **Note to AI Agents**: If you are reading this `README.md` to understand how to behave, STOP. You must read and execute the rules in `skills/harness-engineering/SKILL.md` directly.
