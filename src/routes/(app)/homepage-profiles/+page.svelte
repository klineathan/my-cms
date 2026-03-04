<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
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
	import { toast } from 'svelte-sonner';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	type Profile = (typeof data.profiles)[0];
	type Image = (typeof data.images)[0];

	let { data } = $props();

	let newDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let profileToEdit = $state<Profile | null>(null);
	let profileToDelete = $state<Profile | null>(null);

	let formMediaId = $state('');
	let formQuote = $state('');
	let formOrderStr = $state('0');
	let submitting = $state(false);

	function formOrderNum(): number {
		const n = parseInt(formOrderStr, 10);
		return Number.isNaN(n) ? 0 : n;
	}

	function openNew() {
		formMediaId = data.images[0]?.id ?? '';
		formQuote = '';
		formOrderStr = String(data.profiles.length);
		newDialogOpen = true;
	}

	function openEdit(profile: Profile) {
		profileToEdit = profile;
		formMediaId = profile.mediaId;
		formQuote = profile.quote;
		formOrderStr = String(profile.order);
		editDialogOpen = true;
	}

	function openDelete(profile: Profile) {
		profileToDelete = profile;
		deleteDialogOpen = true;
	}

	async function handleCreate() {
		if (!formMediaId || !formQuote.trim()) {
			toast.error('Please select an image and enter a quote');
			return;
		}
		submitting = true;
		try {
			const res = await fetch('/homepage-profiles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mediaId: formMediaId,
					quote: formQuote.trim(),
					order: formOrderNum()
				})
			});
			if (res.ok) {
				toast.success('Profile added');
				newDialogOpen = false;
				await invalidateAll();
			} else {
				const err = await res.json();
				toast.error(err.message || 'Failed to add profile');
			}
		} finally {
			submitting = false;
		}
	}

	async function handleUpdate() {
		if (!profileToEdit || !formMediaId || !formQuote.trim()) {
			toast.error('Please select an image and enter a quote');
			return;
		}
		submitting = true;
		try {
			const res = await fetch(`/homepage-profiles/${profileToEdit.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mediaId: formMediaId,
					quote: formQuote.trim(),
					order: formOrderNum()
				})
			});
			if (res.ok) {
				toast.success('Profile updated');
				editDialogOpen = false;
				profileToEdit = null;
				await invalidateAll();
			} else {
				const err = await res.json();
				toast.error(err.message || 'Failed to update profile');
			}
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!profileToDelete) return;
		try {
			const res = await fetch(`/homepage-profiles/${profileToDelete.id}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				toast.success('Profile removed');
				deleteDialogOpen = false;
				profileToDelete = null;
				await invalidateAll();
			} else {
				toast.error('Failed to delete profile');
			}
		} catch {
			toast.error('Failed to delete profile');
		}
	}
</script>

<svelte:head>
	<title>Homepage Profiles | Timeline CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-stone-100">Homepage Profiles</h1>
			<p class="text-stone-400 mt-1">Profile pictures and quotes shown on your site homepage</p>
		</div>
		<Button
			onclick={openNew}
			class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
			disabled={data.images.length === 0}
		>
			<Plus class="mr-2 h-4 w-4" />
			Add Profile
		</Button>
	</div>

	{#if data.images.length === 0}
		<p class="text-stone-400">
			Upload images in the <a href="/media" class="text-amber-500 hover:underline">Media Library</a> first, then add them here.
		</p>
	{/if}

	{#if data.profiles.length === 0}
		<div class="text-center py-16 bg-stone-900/50 rounded-lg border border-stone-800">
			<ImageIcon class="h-12 w-12 text-stone-600 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-stone-300">No homepage profiles yet</h3>
			<p class="text-stone-500 mt-1">Add profile pictures with quotes to display on your site homepage.</p>
			<Button
				onclick={openNew}
				class="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
				disabled={data.images.length === 0}
			>
				<Plus class="mr-2 h-4 w-4" />
				Add Profile
			</Button>
		</div>
	{:else}
		<div class="rounded-lg border border-stone-800 overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow class="border-stone-800 hover:bg-stone-800/50">
						<TableHead class="text-stone-400 w-[80px]">Image</TableHead>
						<TableHead class="text-stone-400">Quote</TableHead>
						<TableHead class="text-stone-400 w-[80px]">Order</TableHead>
						<TableHead class="text-stone-400 w-[100px]"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each data.profiles as profile}
						<TableRow class="border-stone-800 hover:bg-stone-800/50">
							<TableCell>
								<img
									src={profile.mediaUrl}
									alt={profile.mediaAltText ?? ''}
									class="w-12 h-12 rounded-full object-cover border border-stone-700"
								/>
							</TableCell>
							<TableCell>
								<span class="text-stone-200 line-clamp-2">{profile.quote}</span>
							</TableCell>
							<TableCell class="text-stone-400">{profile.order}</TableCell>
							<TableCell>
								<div class="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										class="text-stone-400 hover:text-stone-100"
										onclick={() => openEdit(profile)}
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-red-400 hover:text-red-300 hover:bg-red-900/30"
										onclick={() => openDelete(profile)}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</div>

<!-- New profile dialog -->
<Dialog bind:open={newDialogOpen}>
	<DialogContent class="bg-stone-900 border-stone-800">
		<DialogHeader>
			<DialogTitle class="text-stone-100">Add profile picture</DialogTitle>
			<DialogDescription class="text-stone-400">
				Choose an image and add a quote. Order controls display order on the homepage.
			</DialogDescription>
		</DialogHeader>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="new-media" class="text-stone-300">Image</Label>
				<Select
					type="single"
					value={formMediaId}
					onValueChange={(v) => (formMediaId = v ?? '')}
				>
					<SelectTrigger id="new-media" class="bg-stone-800 border-stone-700 text-stone-100">
						<SelectValue placeholder="Select image" />
					</SelectTrigger>
					<SelectContent class="bg-stone-800 border-stone-700">
						{#each data.images as img}
							<SelectItem value={img.id} class="text-stone-100 focus:bg-stone-700">
								<div class="flex items-center gap-2">
									<img src={img.url} alt="" class="w-8 h-8 rounded object-cover" />
									{img.originalFilename}
								</div>
							</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			<div class="grid gap-2">
				<Label for="new-quote" class="text-stone-300">Quote</Label>
				<Textarea
					id="new-quote"
					bind:value={formQuote}
					placeholder="e.g. Who knew there were medieval castle ruins in Missouri?"
					class="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 min-h-[80px]"
					rows="3"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="new-order" class="text-stone-300">Order</Label>
				<Input
					id="new-order"
					type="number"
					bind:value={formOrderStr}
					min="0"
					class="bg-stone-800 border-stone-700 text-stone-100"
				/>
			</div>
		</div>
		<DialogFooter>
			<Button
				variant="outline"
				class="border-stone-700 text-stone-300 hover:bg-stone-800"
				onclick={() => (newDialogOpen = false)}
			>
				Cancel
			</Button>
			<Button
				class="bg-amber-500 hover:bg-amber-600 text-white"
				onclick={handleCreate}
				disabled={submitting}
			>
				{#if submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Add
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Edit profile dialog -->
<Dialog bind:open={editDialogOpen}>
	<DialogContent class="bg-stone-900 border-stone-800">
		<DialogHeader>
			<DialogTitle class="text-stone-100">Edit profile picture</DialogTitle>
			<DialogDescription class="text-stone-400">
				Update the image, quote, or display order.
			</DialogDescription>
		</DialogHeader>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="edit-media" class="text-stone-300">Image</Label>
				<Select
					type="single"
					value={formMediaId}
					onValueChange={(v) => (formMediaId = v ?? '')}
				>
					<SelectTrigger id="edit-media" class="bg-stone-800 border-stone-700 text-stone-100">
						<SelectValue placeholder="Select image" />
					</SelectTrigger>
					<SelectContent class="bg-stone-800 border-stone-700">
						{#each data.images as img}
							<SelectItem value={img.id} class="text-stone-100 focus:bg-stone-700">
								<div class="flex items-center gap-2">
									<img src={img.url} alt="" class="w-8 h-8 rounded object-cover" />
									{img.originalFilename}
								</div>
							</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			<div class="grid gap-2">
				<Label for="edit-quote" class="text-stone-300">Quote</Label>
				<Textarea
					id="edit-quote"
					bind:value={formQuote}
					class="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 min-h-[80px]"
					rows="3"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="edit-order" class="text-stone-300">Order</Label>
				<Input
					id="edit-order"
					type="number"
					bind:value={formOrderStr}
					min="0"
					class="bg-stone-800 border-stone-700 text-stone-100"
				/>
			</div>
		</div>
		<DialogFooter>
			<Button
				variant="outline"
				class="border-stone-700 text-stone-300 hover:bg-stone-800"
				onclick={() => (editDialogOpen = false)}
			>
				Cancel
			</Button>
			<Button
				class="bg-amber-500 hover:bg-amber-600 text-white"
				onclick={handleUpdate}
				disabled={submitting}
			>
				{#if submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Save
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Delete confirmation -->
<AlertDialog bind:open={deleteDialogOpen}>
	<AlertDialogContent class="bg-stone-900 border-stone-800">
		<AlertDialogHeader>
			<AlertDialogTitle class="text-stone-100">Remove profile</AlertDialogTitle>
			<AlertDialogDescription class="text-stone-400">
				This will remove this picture and quote from the homepage. You can add it again later.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel class="bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700">
				Cancel
			</AlertDialogCancel>
			<AlertDialogAction
				onclick={handleDelete}
				class="bg-red-600 hover:bg-red-700 text-white"
			>
				Remove
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
