import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { oAuthClient } from '$lib';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code || code.length === 0) {
		return error(400, 'Invalid code');
	}

	const r = await oAuthClient.getToken(code);

	/**
	 * * Wanted to set cookie sameSite="strict"
	 * * Doing so, create a small redirection bug to /login page
	 */
	cookies.set('access_token', r.tokens.access_token || '', {
		// * doing to actually fixed the problem, but not sure why
		// * better reading this reference
		// https://stackoverflow.com/questions/59990864/what-is-the-difference-between-samesite-lax-and-samesite-strict
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
		maxAge: 60 * 50
	});

	throw redirect(301, '/');
};
