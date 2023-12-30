import { writable } from 'svelte/store';

const createPage = () => {
	const { subscribe, update, set } = writable(1);

	return {
		subscribe,
		increment: () => update((n) => n + 1),
		decrement: () => update((n) => n - 1),
		reset: () => set(1),
	};
};

const createCursor = () => {
	const { subscribe, set } = writable<string | null>(null);
	return { subscribe, set, reset: () => set(null) };
};

// * Notion doesn't have a prev_cursor field, so there we go
const createPrevCursors = () => {
	const { subscribe, update, set } = writable<string[]>([]);

	return {
		subscribe,
		push: (cursor: string) => update((prev) => [...prev, cursor]),
		pop: () => update((prev) => prev.slice(0, prev.length - 1)),
		reset: () => set([]),
	};
};

export const page = createPage();
export const cursor = createCursor();
export const prevCursors = createPrevCursors();
