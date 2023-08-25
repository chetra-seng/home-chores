import type { PageLoad } from './$types';
import databases from '$lib/databases.json';
import { cursor, db } from '$lib/stores';

export const load: PageLoad = async ({ parent, fetch, data }) => {
	const { queryClient } = await parent();
	const { name } = data;

	let selectedDb = databases[0].id;
	let nextCusor: string | null = null;
	db.subscribe((value) => {
		selectedDb = value;
	});
	cursor.subscribe((value) => {
		nextCusor = value;
	});

	// You need to use the SvelteKit fetch function here
	await queryClient.prefetchQuery({
		queryKey: ['schedules', selectedDb, nextCusor],
		queryFn: async () => (await fetch(`/?db=${selectedDb}&cursor=${nextCusor}`)).json()
	});

	return { queryClient, name };
};
