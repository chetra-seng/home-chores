<script>
	import { page } from '$app/stores';

	const code = $page.url.searchParams.has('status') ? $page.url.searchParams.get('status') : '';
</script>

<svelte:head>
	<title>Login - Home Chores</title>
</svelte:head>

<div class="flex flex-col justify-center h-screen">
	{#if code && code.length > 0 && code === '401'}
		<div class="toast toast-top toast-center">
			<div class="alert alert-error">
				<span>User is not authorized! Please contact Chetra Seng for more info.</span>
			</div>
		</div>
	{/if}
	<div class="card w-96 bg-neutral text-neutral-content mx-auto">
		<div class="card-body items-center text-center">
			<div class="card-title prose">
				<h3>Home Chores Login</h3>
			</div>
			<div class="card-body gap-6">
				<p>
					Ensuring Security: Only authorized users have access to <span class="font-bold">Home Chores</span>, a scheduling app
					designed for Chetra Seng's household. If you believe you should have access, please inform
					us. Your cooperation is appreciated.
				</p>
				<form method="post" action="?/auth">
					<button class="btn btn-primary" type="submit">Login with google</button>
				</form>
			</div>
		</div>
	</div>
</div>
