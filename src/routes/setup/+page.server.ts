import { redirect, type Actions } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { createSession, generateSessionToken, storeApiKey } from '$lib/server/auth';
import { db, LOCAL_USER_ID } from '$lib/server/db';
import { setSessionTokenCookie } from '$lib/server/session';

export async function load(event: RequestEvent) {
    if (event.locals.user) {
        redirect(302, "/prompt");
    }
}

export const actions = {
    default: async (event) => {
        const data = await event.request.formData();
        const apiKey = data.get("apiKey") as string;
        const token = generateSessionToken();
        const session = createSession(token, LOCAL_USER_ID);
        setSessionTokenCookie(event, token, session.expiresAt);
        if (storeApiKey(token, apiKey)) {
            console.log("success");
        } else {
            console.error("failed");
        }
        throw redirect(303, "/prompt");
    }
} satisfies Actions;
