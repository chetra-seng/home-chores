import { oAuthClient } from '$lib';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const actions = {
	auth: async () => {
		const url = oAuthClient.generateAuthUrl({
			scope: ['email'],
		});
		throw redirect(302, url);
	},
};

export const load: PageServerLoad = async ({ cookies }) => {
	const access_token = cookies.get('access_token');

	if (access_token && access_token.length > 0) {
		throw redirect(301, '/');
	}
};
