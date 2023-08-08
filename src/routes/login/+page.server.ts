import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { OAuth2Client } from 'google-auth-library';

export const actions = {
	auth: async () => {
		const oAuthClient = new OAuth2Client(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			env.GOOGLE_REDIRECT_URL
		);
		const url = oAuthClient.generateAuthUrl({
			scope: 'email'
		});
		throw redirect(302, url);
	}
};
