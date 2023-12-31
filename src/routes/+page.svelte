<script lang="ts">
	import {page} from "$app/stores";
	import moment from 'moment';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import databases from '$lib/databases.json';
	import { cursor, prevCursors } from '$lib/stores.js';
	import { page as pg } from '$lib/stores';
	import { goto } from '$app/navigation';

	export let data;
	let selectedDb = $page.url.searchParams.has("db") ? $page.url.searchParams.get("db"): databases[0].id
	let nextCursor: null | string = null;
	let currentPage = 0;

	pg.subscribe((value) => {
		currentPage = value;
	});

	cursor.subscribe((value) => {
		nextCursor = value;
	});

	// This data is cached by prefetchQuery in +page.ts so no fetch actually happens here
	$: query = createQuery({
		queryKey: ['schedules', selectedDb, nextCursor],
		queryFn: async () => {
			const res = await fetch(`/?db=${selectedDb}&cursor=${nextCursor}`);
			return await res.json();
		},
	});

	// let queryParam = new URLSearchParams(window.location.search)
	let selected = '';
	const mutation = createMutation({
		mutationKey: ['update-schedule', selected, selectedDb],
		mutationFn: async () => {
			await fetch(`/?id=${selected}&db=${selectedDb}`, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
			});
		},
		onSuccess: () => {
			data.queryClient.invalidateQueries(['schedules']);
			handleDialogClose();
		},
	});

	const handleDialogOpen = () => {
		const dialog = document.getElementById('confirm_dialog') as HTMLDialogElement;
		dialog.showModal();
	};

	const handleDialogClose = () => {
		const dialog = document.getElementById('confirm_dialog') as HTMLDialogElement;
		dialog.close();
	};

	const handleDbChange = (e: any) => {
		goto(`?db=${e.target.value}`)
		pg.reset();
		prevCursors.reset();
		cursor.reset();
	};

</script>

<svelte:head>
	<title>Chore Schedules</title>
</svelte:head>
<main class="text-neutral-content mx-auto">
	<div class="flex flex-col py-8 justify-center">
		<div class="flex flex-col gap-5 items-center prose-lg mx-auto">
			<h3 class="px-2 self-start">Hello, {data.name}!</h3>
			<p class="px-2 self-start">
				View the schedule below. You can switch between chore schedules as well such as bathroom,
				kitchen, and so on. Edit your task if you have completed your chores 😉.
			</p>
			<div class="flex flex-col gap-4">
				<div class="flex flex-row justify-start w-[50%] gap-20">
					<select class="select select-bordered w-full select-sm" on:change={handleDbChange} bind:value={selectedDb}>
						{#each databases as database}
							<option value={database.id}>{database.label}</option>
						{/each}
					</select>
				</div>
				<div
					class="overflow-x-auto border-[1px] border-solid border-gray-500 rounded-lg min-w-[60vw] min-h-[40vh] max-w-[95vw]"
				>
					{#if $query.isFetching}
						<div class="flex flex-col h-[40vh] justify-center">
							<span class="loading loading-spinner loading-lg text-primary mx-auto" />
						</div>
					{:else if $query.isFetched}
						<div class="table table-sm md:table-md lg:table-lg">
							<thead>
								<tr class="text-center">
									<th />
									<th>Name</th>
									<th>Completed Date</th>
									<th>Status</th>
									<th>Action</th>
									<th>Updated By</th>
								</tr>
							</thead>
							<tbody>
								{#each $query.data.result as d, index}
									<tr class="hover">
										<td>{(currentPage - 1) * 10 + (index + 1)}</td>
										<td>{d?.name}</td>
										<td>{d?.date ? moment(d?.date).format('MMMM Do YYYY, h:mm:ss a') : ''}</td>
										<td class="text-center">
											{#if d?.completed}
												<span class="badge badge-outline badge-success lowercase">Completed</span>
											{:else}
												<span class="badge badge-outline badge-error lowercase">Unfinished</span>
											{/if}
										</td>
										<td class="text-center">
											<button
												class="btn btn-sm btn-accent"
												on:click={() => {
													selected = d?.id;
													handleDialogOpen();
												}}>Edit</button
											>
										</td>
										<td>{d?.updatedBy}</td>
									</tr>
								{/each}
							</tbody>
						</div>
					{/if}
				</div>
			</div>
			<div class="join">
				<button
					class={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
					on:click={() => {
						$prevCursors.length > 0
							? cursor.set($prevCursors[$prevCursors.length - 1])
							: cursor.set(null);
						prevCursors.pop();
						pg.decrement();
					}}>«</button
				>
				<button class="join-item btn">Page {currentPage}</button>
				<button
					class={`join-item btn ${$query.data?.pagination.has_more ? '' : 'btn-disabled'}`}
					on:click={() => {
						if ($cursor !== null) {
							prevCursors.push($cursor);
						}
						cursor.set($query.data?.pagination.next_cursor);
						pg.increment();
					}}>»</button
				>
			</div>
		</div>
	</div>
	<dialog id="confirm_dialog" class="modal">
		<form method="dialog" class="modal-box">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
			<h3 class="font-bold text-lg">Update Task?</h3>
			<p class="py-4">
				Mark task as completed? <span class="italic"
					>This action can't be undone. Please proceed with cautions</span
				>
			</p>
			<input bind:value={selected} name="id" hidden />

			<div class="modal-action">
				<button
					class="btn btn-primary"
					on:click={() => {
						$mutation.mutate();
						handleDialogClose();
					}}>Update</button
				>
				<button class="btn">Close</button>
			</div>
		</form>
	</dialog>
</main>
