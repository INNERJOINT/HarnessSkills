# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HarnessSkills** is a repository providing Harness Engineering skills for AI agents. It enforces system-level constraints, state persistence, document-driven development, and automated feedback loops to transform probabilistic AI outputs into deterministic, production-grade results.

The repository contains:
- Core skills in `skills/` (harness-engineering, init-harness-env, using-harness-engineering)
- Superpowers framework in `superpowers/` (brainstorming, debugging, TDD, code review skills)
- Everything Claude Code integration in `everything-claude-code/`
- Oh My Claude Code configuration in `oh-my-claudecode/`
- Reference implementations in `refs/modules/` (everything-claude-code, oh-my-claudecode, superpowers)

## Key Principles

This project operates under **Harness Engineering** principles. Before writing any code:

1. **Check for AGENTS.md or CLAUDE.md** in the root directory for project-specific guardrails
2. **Check for progress tracking files** (feature-tracking.json, progress.md, etc.) if resuming work
3. **Run tests/linters before claiming completion** — never guess if code works

## Development Commands

```bash
# Install as Claude Code plugin (local testing)
/plugin install /Users/yukun/HarnessSkills

# Install from marketplace
/plugin marketplace add INNERJOINT/HarnessSkills
/plugin install harness-skills@HarnessSkills

# Install via npx (other environments)
npx skills install https://github.com/INNERJOINT/HarnessSkills
```

## Project Structure

**Core Skills**:
- `skills/harness-engineering/` — Core executable prompt enforcing guardrails, state persistence, and feedback loops
- `skills/init-harness-env/` — Bootstrap skill to generate AGENTS.md and state files on new projects
- `skills/using-harness-engineering/` — Usage guide for Harness Engineering skill
- `skills/brainstorming/` — Brainstorming skill

**Plugin Infrastructure**:
- `.claude-plugin/` — Claude Code plugin metadata and configuration
- `hooks/` — Lifecycle hooks (SessionStart, UserPromptSubmit, PreToolUse, Stop, SessionEnd)
- `scripts/hooks/` — Hook implementation scripts

**Reference Implementations** (in `refs/modules/`):
- `superpowers/` — Extended skills for brainstorming, debugging, TDD, code review, git workflows
- `everything-claude-code/` — Everything Claude Code ecosystem integration
- `oh-my-claudecode/` — Claude Code optimization and benchmarks
- `claude-code/` — Claude Code implementation repository

**Documentation & State**:
- `refs/docs/` — Research documents on Harness Engineering principles
- `.project/` — Internal state and planning files

## Architecture Notes

**Skill System**: Skills are executable prompts that enforce operational constraints. They are not educational material but rather strict rules that agents must follow. Each skill file (SKILL.md) contains:
- Sequential workflow requirements
- Mandatory verification steps
- State persistence patterns
- Common pitfalls and guardrails

**Plugin Infrastructure**: The repository includes standard Claude Code plugin infrastructure:
- `.claude-plugin/plugin.json` — Plugin metadata and configuration
- `hooks/hooks.json` — Lifecycle hooks for SessionStart, UserPromptSubmit, PreToolUse, Stop, SessionEnd
- Scripts in `scripts/hooks/` execute enforcement logic at key lifecycle points

**State Persistence Pattern**: Projects using Harness Engineering maintain:
- `AGENTS.md` — Project rules, architecture, and common pitfalls
- `feature-tracking.json` (or similar) — Task status, test results, session history
- Progress tracked across sessions to enable long-running agent workflows

## Important Files to Know

- `README.md` — High-level overview and installation instructions
- `skills/harness-engineering/SKILL.md` — The core operational framework (read this before coding)
- `skills/harness-engineering/examples/agent-progress-schema.json` — Schema for state persistence files
- `.claude-plugin/plugin.json` — Plugin metadata
- `hooks/hooks.json` — Lifecycle hook configuration

## When Resuming Work

1. Check if `AGENTS.md` exists in the root — read it completely if present
2. Look for progress tracking files (typically in `docs/agent-state/` or root)
3. Read the progress file to find tasks marked `in_progress` or `failing`
4. Do not rely on conversation history — use the state file as the source of truth

## Before Claiming Completion

1. Run the project's test suite (if applicable)
2. Update the progress tracking file with task status
3. If you encountered undocumented architecture issues or persistent failures, update `AGENTS.md` with a "Common Pitfalls" section
4. Commit your changes with clear messages
