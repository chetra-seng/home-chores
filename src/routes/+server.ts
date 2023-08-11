import { getChoreSchedules, updateSchedule } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ url }) => {
	await updateSchedule(url.searchParams.get('db') || '', url.searchParams.get('id') || '');
	return json({ message: 'Update successful' });
};

export const GET: RequestHandler = async ({ url }) => {
	const data = await getChoreSchedules(
		url.searchParams.get('db') || '',
		url.searchParams.get('cursor') || undefined
	);
	return json(data);
};
