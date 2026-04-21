import { Database } from 'bun:sqlite';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

export interface Session {
  id: string;
  project_path: string;
  agent: string;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: string;
  content: string;
  token_count: number;
  created_at: string;
}

export interface Summary {
  id: string;
  session_id: string;
  condensed_context: string;
  last_message_id: string;
  created_at: string;
}

const DB_PATH = join(homedir(), '.openkore', 'openkore.db');

export class SessionStore {
  private static instance: SessionStore;
  private db: Database;

  private constructor() {
    this.db = new Database(DB_PATH, { create: true });
    this.init();
  }

  public static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  private init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        agent TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        condensed_context TEXT NOT NULL,
        last_message_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tool_cache (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        input_key TEXT NOT NULL,
        output_value TEXT NOT NULL,
        file_mtime INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);
    
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_path ON sessions(project_path)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_tool_cache_key ON tool_cache(session_id, tool_name, input_key)`);
  }

  public getOrCreateSession(projectPath: string, agentId: string): Session {
    const session = this.db.query("SELECT * FROM sessions WHERE project_path = ? ORDER BY created_at DESC LIMIT 1").get(projectPath) as Session | null;
    if (session) return session;

    const id = randomUUID();
    this.db.run("INSERT INTO sessions (id, project_path, agent) VALUES (?, ?, ?)", [id, projectPath, agentId]);
    return { id, project_path: projectPath, agent: agentId, created_at: new Date().toISOString() };
  }

  public addMessage(sessionId: string, role: string, content: string, tokenCount: number = 0): string {
    const id = randomUUID();
    this.db.run("INSERT INTO messages (id, session_id, role, content, token_count) VALUES (?, ?, ?, ?, ?)", [id, sessionId, role, content, tokenCount]);
    return id;
  }

  public getHistory(sessionId: string, limit: number = 50): Message[] {
    return this.db.query("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?").all(sessionId, limit) as Message[];
  }

  public saveSummary(sessionId: string, condensedContext: string, lastMessageId: string) {
    const id = randomUUID();
    this.db.run("INSERT INTO summaries (id, session_id, condensed_context, last_message_id) VALUES (?, ?, ?, ?)", [id, sessionId, condensedContext, lastMessageId]);
  }

  public getLatestSummary(sessionId: string): Summary | null {
    return this.db.query("SELECT * FROM summaries WHERE session_id = ? ORDER BY created_at DESC LIMIT 1").get(sessionId) as Summary | null;
  }

  public getCache(sessionId: string, toolName: string, inputKey: string) {
    return this.db.query("SELECT * FROM tool_cache WHERE session_id = ? AND tool_name = ? AND input_key = ?").get(sessionId, toolName, inputKey);
  }

  public saveCache(sessionId: string, toolName: string, inputKey: string, outputValue: string, fileMtime?: number) {
    const id = randomUUID();
    this.db.run(
      "INSERT OR REPLACE INTO tool_cache (id, session_id, tool_name, input_key, output_value, file_mtime) VALUES (?, ?, ?, ?, ?, ?)",
      [id, sessionId, toolName, inputKey, outputValue, fileMtime || null]
    );
  }

  public deleteMessages(messageIds: string[]) {
    if (messageIds.length === 0) return;
    const placeholders = messageIds.map(() => '?').join(',');
    this.db.run(`DELETE FROM messages WHERE id IN (${placeholders})`, messageIds);
  }
}
