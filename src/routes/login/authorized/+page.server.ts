import { error, redirect } from '@sveltejs/kit';
import { OAuth2Client } from 'google-auth-library';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code || code.length === 0) {
		return error(400, 'Invalid code');
	}

	const oAuthClient = new OAuth2Client(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		env.GOOGLE_REDIRECT_URL
	);

	const r = await oAuthClient.getToken(code);
	console.log(r.tokens);
	console.log(new Date().getTime());

	cookies.set('access_token', r.tokens.access_token || '', {
		sameSite: 'strict',
		httpOnly: true,
		path: '/',
		maxAge: 60 * 50
	});

	cookies.set('refresh_token', r.tokens.refresh_token || '', {
		sameSite: 'strict',
		httpOnly: true,
		path: '/',
		maxAge: 60 * 60 * 2
	});

	throw redirect(302, '/');
};
