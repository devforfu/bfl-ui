import { db } from './db';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

export const ONE_MONTH_IN_MS = 1000 * 60 * 60 * 24 * 30;

export function generateSessionToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return encodeBase32LowerCaseNoPadding(bytes);
}

export function createSession(token: string, userId: number, { expirationSpan = ONE_MONTH_IN_MS } = {}): Session {
    const sessionId = encodeToken(token);
    const session: Session = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + expirationSpan),
    };
    db.execute(
        "INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)",
        session.id,
        session.userId,
        Math.floor(session.expiresAt.getTime() / 1000),
    )
    return session;
}

export function validateSessionToken(token: string): SessionValidationResult {
    const sessionId = encodeToken(token);
    const row = db.queryOne(
        "SELECT session.id, session.user_id, session.expires_at FROM session INNER JOIN user ON user.id = session.user_id WHERE session.id = ?",
        sessionId,
    );
    if (row === null) {
        return { session: null, user: null };
    }
    const record = row as { id: string, user_id: number, expires_at: number };
    const session: Session = {
        id: record.id,
        userId: record.user_id,
        expiresAt: new Date(record.expires_at * 1000),
    };
    const user: User = { id: record.user_id, githubId: -1, username: "" };
    if (Date.now() >= session.expiresAt.getTime()) {
        db.execute("DELETE FROM session WHERE id = ?", session.id);
        return { session: null, user: null };
    }
    if (Date.now() >= session.expiresAt.getTime() - ONE_MONTH_IN_MS / 2) {
        session.expiresAt = new Date(Date.now() + ONE_MONTH_IN_MS);
        db.execute(
            "UPDATE session SET expires_at = ? WHERE id = ?",
            Math.floor(session.expiresAt.getTime() / 1000),
            session.id,
        );
    }
    return { session, user };
}

export function invalidateSession(sessionId: string): void {
    db.execute("DELETE FROM session WHERE id = ?", sessionId);
}

export function storeApiKey(token: string, apiKey: string): boolean {
    const { session, user } = validateSessionToken(token);
    if (session === null || user === null) {
        console.error("cannot store API key: user is not found");
        return false;
    }
    const updatedAt = Math.floor(new Date(Date.now()).getTime() / 1000);
    db.execute(
        "DELETE FROM api_key WHERE user_id = ?", user.id
    );
    db.execute(
        "INSERT INTO api_key (key, user_id, updated_at) VALUES (?, ?, ?)",
        apiKey,
        user.id,
        updatedAt,
    );
    return true;
}

export function fetchApiKey(token: string) {
    const { session, user } = validateSessionToken(token);
    if (session === null || user === null) return { apiKey: null };
    const { key } = db.queryOne("SELECT api_key.key FROM api_key WHERE api_key.user_id = ?", user.id);
    return { apiKey: key };
}

export type SessionValidationResult =
    | { session: Session; user: User }
    | { session: null; user: null };

export type ApiKeyResult =
    | { apiKey: string }
    | { apiKey: null };

export interface Session {
    id: string;
    userId: number;
    expiresAt: Date;
}

export interface User {
    id: number;
    githubId: number;
    username: string;
}

export interface ApiKey {
    id: string;
    userId: number;
    createdAt: Date;
}

export function encodeToken(token: string): string {
    return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}