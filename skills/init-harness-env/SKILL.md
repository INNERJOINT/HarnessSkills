---
name: init-harness-env
description: invoke when starting a new project, or when requested to initialize the harness engineering environment, or when AGENTS.md is missing from the project root.
---

<EXTREMELY-IMPORTANT>
You have been invoked to bootstrap the Harness Engineering environment for this project.
Do NOT write any application code until this infrastructure is fully initialized.
</EXTREMELY-IMPORTANT>

## Phase 1: Create the Golden Architecture

You must create the following directory structure and files in the root of the user's project:

```text
/ (Project Root)
├── AGENTS.md                  # Routing and pre-flight checklist 
├── ARCHITECTURE.md            # Static architectural rules
├── LEARNINGS.md               # Dynamic pitfall logging
└── docs/agent-state/          # Long-term agent memory
    ├── PROGRESS.json          # Task state tracker
    ├── design-docs/           # Brainstorming output
    └── exec-plans/            # Step-by-step checklists
```

### 1. Create Directories
Run the following commands to create the persistence directories:
```bash
mkdir -p docs/agent-state/design-docs docs/agent-state/exec-plans
```

### 2. Create `AGENTS.md`
Create a file named `AGENTS.md` in the root directory exactly as follows:

```markdown
<EXTREMELY-IMPORTANT>
Your operations in this project MUST follow Harness Engineering principles.
Before writing any code, you MUST complete the following 3 checks in order.
If you skip these, you are operating in violation of system constraints.
</EXTREMELY-IMPORTANT>

## 1. Read Guardrails
You must understand the rules and common pitfalls of this project.
- 🏛️ **Architecture**: Read `ARCHITECTURE.md` (Directory structure, dependency rules, tech stack constraints).
- 🩹 **Learnings**: Read `LEARNINGS.md` (Project-specific environment gotchas and API nuances. **Never trip over the same bug twice**).

## 2. Check State
You are a long-running agent. Do not guess your progress from the chat history.
- 📊 **Current State**: Read `docs/agent-state/PROGRESS.json` to find the task currently marked as `in_progress`.
- 📝 **Design Docs**: If your task requires high-level context, consult `docs/agent-state/design-docs/`.
- 🏃 **Execution Plans**: If the task relies on a multi-step execution plan, consult `docs/agent-state/exec-plans/`.

## 3. Use Skills
Do not write code ad-hoc. 
- 🛠️ **Load Skills**: If you are implementing a specific type of task (e.g., debugging, planning, testing), invoke the relevant skills via your tools.

---

## 🛑 Pre-completion Checklist
Before telling the user "I have finished this task," you MUST verify:
1. [ ] **Test Execution**: Have I run the required test suite and ensured everything passes?
2. [ ] **State Machine Update**: Have I updated `docs/agent-state/PROGRESS.json` to mark this task as completed?
3. [ ] **Feedback Loop**: Did I encounter a bug or constraint that took more than 5 minutes to solve? If so, have I added the solution to `LEARNINGS.md`?

<EXTREMELY-IMPORTANT>
If you have not checked the three boxes above, **the task is not complete**.
Immediately run your validation and save your state!
</EXTREMELY-IMPORTANT>
```

### 3. Create `ARCHITECTURE.md`
Create a basic `ARCHITECTURE.md` snippet. Ask the user context later to fill this out.
```markdown
# Architecture Rules

> **Note for AI Agents**: This file contains the unbreakable static rules of this codebase. 

## Stack
- [List main languages, frameworks, databases]

## Dependency Rules
- [e.g., the UI layer cannot directly query the database layer]

## Testing Standards
- [e.g., all functions must have 80% test coverage using Jest]
```

### 4. Create `LEARNINGS.md`
Create an initial empty `LEARNINGS.md`:
```markdown
# Agent Learnings & Pitfalls

> **Note for AI Agents**: This file is dynamic. When you encounter an obscure error, a specific required configuration, or an undocumented API constraint that costs you time, you **must** document it here so the next agent session does not repeat the mistake.

## Resolved Issues
- [Date] - Placeholder: No critical learnings recorded yet.
```

### 5. Create `docs/agent-state/PROGRESS.json`
Create the initial tracking JSON file:
```json
{
  "project": "Current Project",
  "status": "Initialized",
  "features": [
    {
      "id": "init-01",
      "name": "Initialize Harness Engineering Environment",
      "status": "completed",
      "notes": "Directory structure and baseline files generated successfully."
    }
  ]
}
```

## Phase 2: Handoff
Once you have created these files:
1. Run `git add` to stage these initial scaffold files (if the project uses Git).
2. Ask the user: *"The Harness Engineering environment has been initialized. Before we begin the first feature, would you like to define specific rules for `ARCHITECTURE.md`, or shall we proceed with brainstorming the first execution plan?"*
