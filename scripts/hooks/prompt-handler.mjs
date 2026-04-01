import { parseStdin, sendHookOutput } from '../lib/io.mjs';

async function main() {
  const payload = await parseStdin();
  if (!payload || !payload.prompt) {
    // Pass through unaltered if there's no payload
    sendHookOutput('UserPromptSubmit');
    return;
  }

  let prompt = payload.prompt;
  const originalPrompt = prompt.toLowerCase();
  
  let modifications = [];
  
  // MAGIC KEYWORD: tdd
  // Forces the agent into Test Driven Development mode
  if (originalPrompt.includes('tdd') || originalPrompt.includes('test driven')) {
    prompt += `\n\n<harness-enforcement>
[MAGIC KEYWORD ACTIVATED: TDD]
The user has requested Test Driven Development. 
You MUST NOT write implementation code before writing a failing test.
1. Write failing test
2. Run test to verify it fails
3. Write minimum code to pass
4. Run test to verify it passes
</harness-enforcement>`;
    modifications.push('TDD Mode');
  }

  // MAGIC KEYWORD: audit
  if (originalPrompt.includes('audit')) {
    prompt += `\n\n<harness-enforcement>
[MAGIC KEYWORD ACTIVATED: SYSTEMATIC AUDIT]
You are now in Audit Mode. 
1. Do NOT make changes immediately.
2. Formulate a hypothesis and investigate root causes first.
3. Review related code paths.
</harness-enforcement>`;
    modifications.push('Audit Mode');
  }

  // Return the modified prompt if changes occurred
  if (modifications.length > 0) {
    sendHookOutput('UserPromptSubmit', `Activated Harness Modes: ${modifications.join(', ')}`, {
      prompt: prompt
    });
  } else {
    // No modifications
    sendHookOutput('UserPromptSubmit');
  }
}

main().catch(err => {
  console.error(`[Prompt Handler] Critical Error: ${err.message}`);
  // Return neutral output so Claude Code doesn't crash on hook error
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit' }}) + '\n');
  process.exit(1);
});
