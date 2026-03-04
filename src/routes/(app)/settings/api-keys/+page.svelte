<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle
	} from '$lib/components/ui/alert-dialog';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Plus from '@lucide/svelte/icons/plus';
	import Key from '@lucide/svelte/icons/key';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Copy from '@lucide/svelte/icons/copy';
	import { formatDistanceToNow } from 'date-fns';

	let { data } = $props();

	let createDialogOpen = $state(false);
	let newKeyDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let keyName = $state('');
	let generatedKey = $state('');
	let keyToDelete = $state<string | null>(null);

	async function createApiKey() {
		if (!keyName.trim()) {
			toast.error('Please enter a name for the API key');
			return;
		}

		const response = await fetch('/settings/api-keys', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: keyName })
		});

		if (response.ok) {
			const { apiKey } = await response.json();
			generatedKey = apiKey;
			createDialogOpen = false;
			newKeyDialogOpen = true;
			keyName = '';
			invalidateAll();
		} else {
			toast.error('Failed to create API key');
		}
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(generatedKey);
		toast.success('API key copied to clipboard');
	}

	function confirmDelete(keyId: string) {
		keyToDelete = keyId;
		deleteDialogOpen = true;
	}

	async function deleteApiKey() {
		if (!keyToDelete) return;

		const response = await fetch(`/settings/api-keys/${keyToDelete}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			toast.success('API key deleted');
			invalidateAll();
		} else {
			toast.error('Failed to delete API key');
		}

		deleteDialogOpen = false;
		keyToDelete = null;
	}
</script>

<svelte:head>
	<title>API Keys | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				href="/settings"
				class="text-stone-400 hover:text-stone-100"
			>
				<ArrowLeft class="h-5 w-5" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold text-stone-100">API Keys</h1>
				<p class="text-stone-400 mt-1">Manage API keys for external access to your content</p>
			</div>
		</div>
		<Button
			onclick={() => (createDialogOpen = true)}
			class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
		>
			<Plus class="mr-2 h-4 w-4" />
			New API Key
		</Button>
	</div>

	<!-- API Keys List -->
	<Card class="bg-stone-900/50 border-stone-800">
		<CardHeader>
			<CardTitle class="text-stone-100">Your API Keys</CardTitle>
			<CardDescription class="text-stone-400">
				Use these keys to authenticate API requests from your client applications.
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.apiKeys.length === 0}
				<div class="text-center py-12">
					<Key class="h-12 w-12 text-stone-600 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-stone-300">No API keys</h3>
					<p class="text-stone-500 mt-1">Create your first API key to enable external access</p>
					<Button
						onclick={() => (createDialogOpen = true)}
						class="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
					>
						<Plus class="mr-2 h-4 w-4" />
						Create API Key
					</Button>
				</div>
			{:else}
				<Table>
					<TableHeader>
						<TableRow class="border-stone-800 hover:bg-stone-800/50">
							<TableHead class="text-stone-400">Name</TableHead>
							<TableHead class="text-stone-400">Key</TableHead>
							<TableHead class="text-stone-400">Status</TableHead>
							<TableHead class="text-stone-400">Last Used</TableHead>
							<TableHead class="text-stone-400">Created</TableHead>
							<TableHead class="text-stone-400 w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.apiKeys as key}
							<TableRow class="border-stone-800 hover:bg-stone-800/50">
								<TableCell class="font-medium text-stone-100">{key.name}</TableCell>
								<TableCell class="text-stone-400 font-mono text-sm">
									{key.keyPrefix}••••••••
								</TableCell>
								<TableCell>
									<Badge
										variant="secondary"
										class={key.isActive
											? 'bg-green-500/10 text-green-500'
											: 'bg-stone-500/10 text-stone-500'}
									>
										{key.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</TableCell>
								<TableCell class="text-stone-400">
									{key.lastUsedAt
										? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })
										: 'Never'}
								</TableCell>
								<TableCell class="text-stone-400">
									{formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon"
										onclick={() => confirmDelete(key.id)}
										class="text-stone-400 hover:text-red-400"
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>

	<!-- Usage Info -->
	<Card class="bg-stone-900/50 border-stone-800">
		<CardHeader>
			<CardTitle class="text-stone-100">API Usage</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<p class="text-stone-400">
				Include your API key in the <code class="bg-stone-800 px-1 py-0.5 rounded text-amber-400">Authorization</code> header:
			</p>
			<pre class="bg-stone-800 p-4 rounded-lg text-sm text-stone-300 overflow-x-auto"><code>Authorization: Bearer your_api_key_here</code></pre>
			<div class="space-y-2">
				<p class="text-stone-400 font-medium">Available Endpoints:</p>
				<ul class="list-disc list-inside text-stone-400 space-y-1">
					<li><code class="bg-stone-800 px-1 py-0.5 rounded text-amber-400">GET /api/v1/posts</code> - List all published posts</li>
					<li><code class="bg-stone-800 px-1 py-0.5 rounded text-amber-400">GET /api/v1/posts/:id</code> - Get a specific post</li>
				</ul>
			</div>
		</CardContent>
	</Card>
</div>

<!-- Create Dialog -->
<Dialog bind:open={createDialogOpen}>
	<DialogContent class="bg-stone-900 border-stone-800">
		<DialogHeader>
			<DialogTitle class="text-stone-100">Create API Key</DialogTitle>
			<DialogDescription class="text-stone-400">
				Give your API key a descriptive name to identify its purpose.
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="keyName" class="text-stone-300">Name</Label>
				<Input
					id="keyName"
					bind:value={keyName}
					placeholder="e.g., Personal Website"
					class="bg-stone-800 border-stone-700 text-stone-100"
				/>
			</div>
		</div>
		<DialogFooter>
			<Button
				variant="outline"
				onclick={() => (createDialogOpen = false)}
				class="border-stone-700 text-stone-300"
			>
				Cancel
			</Button>
			<Button onclick={createApiKey} class="bg-amber-500 hover:bg-amber-600 text-white">
				Create Key
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- New Key Dialog -->
<Dialog bind:open={newKeyDialogOpen}>
	<DialogContent class="bg-stone-900 border-stone-800">
		<DialogHeader>
			<DialogTitle class="text-stone-100">API Key Created</DialogTitle>
			<DialogDescription class="text-stone-400">
				Make sure to copy your API key now. You won't be able to see it again!
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div class="flex items-center gap-2">
				<Input
					value={generatedKey}
					readonly
					class="bg-stone-800 border-stone-700 text-stone-100 font-mono"
				/>
				<Button
					variant="outline"
					size="icon"
					onclick={copyToClipboard}
					class="border-stone-700 text-stone-300 hover:bg-stone-800"
				>
					<Copy class="h-4 w-4" />
				</Button>
			</div>
		</div>
		<DialogFooter>
			<Button
				onclick={() => {
					newKeyDialogOpen = false;
					generatedKey = '';
				}}
				class="bg-amber-500 hover:bg-amber-600 text-white"
			>
				Done
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Delete Confirmation Dialog -->
<AlertDialog bind:open={deleteDialogOpen}>
	<AlertDialogContent class="bg-stone-900 border-stone-800">
		<AlertDialogHeader>
			<AlertDialogTitle class="text-stone-100">Delete API Key</AlertDialogTitle>
			<AlertDialogDescription class="text-stone-400">
				Are you sure you want to delete this API key? Any applications using this key will lose
				access.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel class="bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700">
				Cancel
			</AlertDialogCancel>
			<AlertDialogAction onclick={deleteApiKey} class="bg-red-600 hover:bg-red-700 text-white">
				Delete
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

