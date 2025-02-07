import { db } from "$lib/server/db";
import { fail, json } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";

export async function POST(event: RequestEvent) {
    if (event.locals.user === null) {
        throw fail(403);
    }
    const userId = event.locals.user.id;
    const result = db.queryOne("SELECT key FROM api_key WHERE api_key.user_id = ?", userId);
    return json({ apiKey: result.key });
}