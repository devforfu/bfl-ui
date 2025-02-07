import { redirect } from "@sveltejs/kit";

export async function load(event) {
    redirect(302, "/setup");
}