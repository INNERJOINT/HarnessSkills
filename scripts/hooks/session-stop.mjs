import fs from 'fs';
import path from 'path';
import { getSessionState } from '../lib/state-manager.mjs';
import { parseStdin, sendHookOutput } from '../lib/io.mjs';

async function main() {
  const payload = await parseStdin();
  
  if (!payload) {
    sendHookOutput('Stop');
    return;
  }

  const state = getSessionState();
  
  // Example implementation of state tracking:
  // We check if there's a local 'claude-progress.txt' or '.claude/todos.json'
  // If so, we save them into our central state manager to be recovered next session.
  
  let activeTasks = [];
  
  // 1. Try reading standard todo tracking
  const todosPath = path.resolve(process.cwd(), '.claude/todos.json');
  if (fs.existsSync(todosPath)) {
    try {
      const todosData = JSON.parse(fs.readFileSync(todosPath, 'utf8'));
      // Filter out completed ones
      const pending = todosData.filter(t => t.status !== 'completed');
      if (pending.length > 0) {
        activeTasks.push({ source: 'todos.json', tasks: pending });
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // 2. Try reading Anthropic style claude-progress.txt
  const progressPath = path.resolve(process.cwd(), 'claude-progress.txt');
  if (fs.existsSync(progressPath)) {
    try {
      const progressContent = fs.readFileSync(progressPath, 'utf8');
      activeTasks.push({ source: 'claude-progress.txt', summary: progressContent.slice(0, 1000) }); // truncate to 1k chars
    } catch (e) {
      // Ignore errors
    }
  }

  // If we found any pending work, save it to state
  if (activeTasks.length > 0) {
    state.set('active_tasks', activeTasks);
  } else {
    // Clean up state if nothing is active
    state.delete('active_tasks');
  }

  sendHookOutput('Stop');
}

main().catch(err => {
  console.error(`[SessionStop Handler] Critical Error: ${err.message}`);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'Stop' }}) + '\n');
  process.exit(1);
});
