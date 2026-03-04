<script lang="ts">
	import { getSupabaseClient } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const supabase = getSupabaseClient();
			const { error: authError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (authError) {
				error = authError.message;
			} else {
				goto('/');
			}
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login | My CMS</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-4">
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent"></div>
	
	<Card class="w-full max-w-md relative z-10 bg-stone-900/80 backdrop-blur-sm border-stone-800">
		<CardHeader class="text-center space-y-4">
			<div class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
				<span class="text-2xl font-bold text-white">T</span>
			</div>
			<div>
				<CardTitle class="text-2xl font-semibold tracking-tight text-stone-100">My CMS</CardTitle>
				<CardDescription class="text-stone-400">Sign in to manage your content</CardDescription>
			</div>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleLogin} class="space-y-4">
				{#if error}
					<Alert variant="destructive" class="bg-red-950/50 border-red-900">
						<AlertCircle class="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				<div class="space-y-2">
					<Label for="email" class="text-stone-300">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						required
						disabled={loading}
						class="bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-amber-500/20"
					/>
				</div>

				<div class="space-y-2">
					<Label for="password" class="text-stone-300">Password</Label>
					<Input
						id="password"
						type="password"
						placeholder="••••••••"
						bind:value={password}
						required
						disabled={loading}
						class="bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-amber-500/20"
					/>
				</div>

				<Button
					type="submit"
					class="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-amber-500/20"
					disabled={loading}
				>
					{#if loading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Signing in...
					{:else}
						Sign in
					{/if}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>

