<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Key from '@lucide/svelte/icons/key';
	import Settings from '@lucide/svelte/icons/settings';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
</script>

<svelte:head>
	<title>Settings | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-stone-100">Settings</h1>
		<p class="text-stone-400 mt-1">Manage your CMS settings</p>
	</div>

	<div class="grid gap-4">
		<a href="/settings/api-keys" class="block">
			<Card class="bg-stone-900/50 border-stone-800 hover:bg-stone-800/50 transition-colors">
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
								<Key class="h-6 w-6 text-amber-500" />
							</div>
							<div>
								<h3 class="font-semibold text-stone-100">API Keys</h3>
								<p class="text-sm text-stone-400">Manage API keys for external access</p>
							</div>
						</div>
						<ChevronRight class="h-5 w-5 text-stone-500" />
					</div>
				</CardContent>
			</Card>
		</a>
	</div>
</div>

