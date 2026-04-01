import fs from 'fs';
import path from 'path';

// Define the root state directory
const HARNESS_STATE_DIR = path.resolve(process.cwd(), '.harness/state');

export class StateManager {
  constructor(sessionId = 'global') {
    this.sessionId = sessionId;
    this.dbDir = path.join(HARNESS_STATE_DIR, sessionId);

    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
  }

  _getFilePath(key) {
    // Basic sanitization
    const safeKey = key.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    return path.join(this.dbDir, `${safeKey}.json`);
  }

  get(key, defaultValue = null) {
    const file = this._getFilePath(key);
    if (!fs.existsSync(file)) return defaultValue;
    try {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`[HarnessState] Error reading key ${key}: ${err.message}`);
      return defaultValue;
    }
  }

  set(key, value) {
    const file = this._getFilePath(key);
    try {
      fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error(`[HarnessState] Error writing key ${key}: ${err.message}`);
      return false;
    }
  }

  delete(key) {
    const file = this._getFilePath(key);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      return true;
    }
    return false;
  }
}

/**
 * Returns a globally shared state manager instance (for non-session specific tracking)
 */
export function getGlobalState() {
  return new StateManager('global');
}

/**
 * Returns a session-specific state manager. Requires CLAUDE_SESSION_ID.
 */
export function getSessionState() {
  const sessionId = process.env.CLAUDE_SESSION_ID || 'default_session';
  return new StateManager(sessionId);
}
