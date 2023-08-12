<script lang="ts">
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import '../app.css';
	import type { LayoutData } from './$types';
	export let data: LayoutData;
</script>

<svelte:head>
	<meta name="author" content="Chetra Seng" />
	<meta name="description" content="Chore schedules for Chetra's home :D" />
</svelte:head>
<QueryClientProvider client={data.queryClient}>
	<slot />
</QueryClientProvider>
