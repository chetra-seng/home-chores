import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const access_token = cookies.get('access_token');

	if (!access_token || access_token.length === 0) {
		throw redirect(302, '/login');
	}

	return {};
};
