import { parseStdin, sendHookOutput, blockToolUse } from '../lib/io.mjs';

async function main() {
  const payload = await parseStdin();
  
  // Failsafe exit
  if (!payload || !payload.toolName) {
    sendHookOutput('PreToolUse');
    return;
  }

  const { toolName, contextPercent = 0 } = payload;
  let additionalContext = '';

  // 1. Guard rails against context overflow (Max 72% context allowed for agent spawning)
  if (toolName === 'Task' || toolName === 'SubagentStart' || toolName === 'Agent') {
    if (contextPercent > 0.72) {
      // Actively block the tool usage instead of warning
      return blockToolUse(
        'Context limits exceeded', 
        `Your current context is at ${(contextPercent * 100).toFixed(1)}%. Spawning a subagent now poses a definitive risk of breaking the session or dropping important history. You MUST run the 'compact' command or summarize and drop context before exploring further.`
      );
    }
  }

  // 2. Specific Tool Overrides & Guidelines
  if (toolName === 'Bash') {
    // Inject verification rule just-in-time
    additionalContext += `
[HARNESS RULE: VERIFICATION REQUIRED] 
Whenever using Bash to check tests or build output, you MUST manually read the output and never guess the outcome.
Remember: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE".
`;
  }

  // Return ok state
  sendHookOutput('PreToolUse', additionalContext);
}

main().catch(err => {
  console.error(`[PreTool Enforcer] Critical Error: ${err.message}`);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse' }}) + '\n');
  process.exit(1);
});
