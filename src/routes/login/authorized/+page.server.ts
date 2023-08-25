import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAuthUsers, oAuthClient } from '$lib';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code || code.length === 0) {
		return error(400, 'Invalid code');
	}

	const r = await oAuthClient.getToken(code);

	if (r.tokens.access_token) {
		const info = await oAuthClient.getTokenInfo(r.tokens.access_token);
		const users = await getAuthUsers(env.AUTH_USER_NOTION);

		const allowedEmails: Record<string, string> = {};
		users.users.forEach((user) => {
			if (user) {
				allowedEmails[user.email] = user.name;
			}
		});
		if (Object.keys(allowedEmails).includes(info.email || '')) {
			/**
			 * * Wanted to set cookie sameSite="strict"
			 * * Doing so, create a small redirection bug to /login page
			 */
			const cookieOpts = {
				// * doing to actually fixed the problem, but not sure why
				// * better reading this reference
				// https://stackoverflow.com/questions/59990864/what-is-the-difference-between-samesite-lax-and-samesite-strict
				sameSite: 'lax',
				httpOnly: true,
				path: '/',
				maxAge: 60 * 50
			} as any;
			cookies.set('access_token', r.tokens.access_token || '', cookieOpts);

			cookies.set('name', allowedEmails[info.email || 'undefine'], cookieOpts);

			throw redirect(301, '/');
		} else {
			throw redirect(301, '/login?status=401');
		}
	}
};
