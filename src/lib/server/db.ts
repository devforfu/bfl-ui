import DatabaseConstructor, { type Database } from 'better-sqlite3';

let database: Database | undefined;

export const LOCAL_USER_ID = 0;

const sqlCreateDbIfNotReady = `
CREATE TABLE IF NOT EXISTS user (
    id INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_key (
    key TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO user(id) VALUES (${LOCAL_USER_ID});
`;

class AppData {
    private database: Database;

    constructor({ dbScript = sqlCreateDbIfNotReady } = {}) {
        this.database = new DatabaseConstructor('/tmp/db.sqlite');
        if (dbScript) this.database.exec(dbScript);
    }

    execute(query: string, ...args: any[]): void {
        const insert = this.database.prepare(query);
        const info = insert.run(...args);
        console.debug(`lines changed: ${info.changes}`);
    }

    queryOne(query: string, ...args: any[]): any | null {
        const select = this.database.prepare(query);
        return select.get(...args) || null;
    }
}

export const db = new AppData();