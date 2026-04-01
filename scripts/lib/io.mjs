/**
 * HarnessSkills IO Library
 * Safely reads from stdin (as Claude Code passes event payloads via stdin)
 * and provides standardized output methods.
 */

export async function getStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    // Return empty immediately if no data is piped
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    // Fallback timeout in case of hanging stdin
    setTimeout(() => resolve(data), 5000).unref();
  });
}

export async function parseStdin() {
  const stdinStr = await getStdin();
  if (!stdinStr) return null;
  try {
    return JSON.parse(stdinStr);
  } catch (err) {
    console.error(`[HarnessSkills] Error parsing stdin JSON: ${err.message}`);
    return null;
  }
}

/**
 * Standardizes the hook specific output payload back to Claude Code.
 */
export function sendHookOutput(eventName, additionalContext = '', overrides = {}) {
  const payload = {
    hookSpecificOutput: {
      hookEventName: eventName,
      ...overrides
    }
  };

  if (additionalContext) {
    payload.hookSpecificOutput.additionalContext = additionalContext;
  }

  // Use process.stdout directly to avoid console.log appending unintended newlines or formatting
  process.stdout.write(JSON.stringify(payload) + '\n');
}

/**
 * Send an explicit hook error/decision to block behavior
 */
export function blockToolUse(reason, context = '') {
  sendHookOutput('PreToolUse', context, {
    decision: 'block',
    reason: reason
  });
}
