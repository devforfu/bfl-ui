import { redirect } from '@sveltejs/kit';

export async function load(event) {
    if (event.locals.user === null) {
        redirect(302, "/setup");
    }
}