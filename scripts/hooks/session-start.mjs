import { getSessionState } from '../lib/state-manager.mjs';
import { sendHookOutput } from '../lib/io.mjs';

async function main() {
  const state = getSessionState();
  let additionalContext = '';

  // 1. Recover uncompleted tasks/state
  const pendingTasks = state.get('active_tasks');
  if (pendingTasks && pendingTasks.length > 0) {
    additionalContext += `
<session-restore>
[PENDING TASKS RECOVERED FROM PREVIOUS SESSION]
We found unfinished tasks stored in .harness/state/. Here they are:
${JSON.stringify(pendingTasks, null, 2)}

Please ask the user if they would like to continue where they left off.
</session-restore>
`;
  }

  // 2. Inject Harness Rules (Similar to Superpowers)
  additionalContext += `
<harness-rules>
[HARNESS SYSTEM ENABLED]
1. You are running within HarnessSkills. All operations are strictly guarded.
2. VERIFICATION BEFORE COMPLETION is mandatory. Do not guess or assume.
3. Keep track of complex state in \`.harness/state/\` if necessary.
</harness-rules>
`;

  sendHookOutput('SessionStart', additionalContext);
}

main().catch(err => {
  console.error(`[SessionStart Hook] Critical Error: ${err.message}`);
  process.exit(1);
});
