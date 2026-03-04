<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
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
	import { invalidateAll } from '$app/navigation';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import Image from '@lucide/svelte/icons/image';
	import Video from '@lucide/svelte/icons/video';
	import Music from '@lucide/svelte/icons/music';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Copy from '@lucide/svelte/icons/copy';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import X from '@lucide/svelte/icons/x';
	import { formatDistanceToNow } from 'date-fns';

	let { data } = $props();

	let uploadDialogOpen = $state(false);
	let detailDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let selectedMedia = $state<(typeof data.media)[0] | null>(null);
	let mediaToDelete = $state<string | null>(null);
	let typeFilter = $state('all');
	let uploading = $state(false);
	let uploadProgress = $state<string[]>([]);

	function getMediaIcon(type: string) {
		switch (type) {
			case 'image':
				return Image;
			case 'video':
				return Video;
			case 'audio':
				return Music;
			default:
				return Image;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files) return;

		uploading = true;
		uploadProgress = [];

		const files = Array.from(input.files);

		for (const file of files) {
			uploadProgress = [...uploadProgress, `Uploading ${file.name}...`];

			const formData = new FormData();
			formData.append('file', file);

			try {
				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					uploadProgress = uploadProgress.map((p) =>
						p.includes(file.name) ? `✓ ${file.name}` : p
					);
				} else {
					uploadProgress = uploadProgress.map((p) =>
						p.includes(file.name) ? `✗ ${file.name} (failed)` : p
					);
				}
			} catch {
				uploadProgress = uploadProgress.map((p) =>
					p.includes(file.name) ? `✗ ${file.name} (error)` : p
				);
			}
		}

		uploading = false;
		setTimeout(() => {
			uploadDialogOpen = false;
			uploadProgress = [];
			invalidateAll();
		}, 1000);
	}

	function openDetail(item: (typeof data.media)[0]) {
		selectedMedia = item;
		detailDialogOpen = true;
	}

	function copyUrl() {
		if (selectedMedia) {
			navigator.clipboard.writeText(selectedMedia.url);
			toast.success('URL copied to clipboard');
		}
	}

	function confirmDelete(mediaId: string) {
		mediaToDelete = mediaId;
		deleteDialogOpen = true;
		detailDialogOpen = false;
	}

	async function handleDelete() {
		if (!mediaToDelete) return;

		const response = await fetch(`/media/${mediaToDelete}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			toast.success('Media deleted');
			invalidateAll();
		} else {
			toast.error('Failed to delete media');
		}

		deleteDialogOpen = false;
		mediaToDelete = null;
	}

	const filteredMedia = $derived(
		typeFilter === 'all' ? data.media : data.media.filter((m) => m.mediaType === typeFilter)
	);
</script>

<svelte:head>
	<title>Media Library | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-stone-100">Media Library</h1>
			<p class="text-stone-400 mt-1">Manage your uploaded media files</p>
		</div>
		<Button
			onclick={() => (uploadDialogOpen = true)}
			class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
		>
			<Plus class="mr-2 h-4 w-4" />
			Upload Media
		</Button>
	</div>

	<!-- Filters -->
	<div class="flex gap-4">
		<Select type="single" value={typeFilter} onValueChange={(v) => v && (typeFilter = v)}>
			<SelectTrigger class="w-[160px] bg-stone-800/50 border-stone-700 text-stone-100">
				<SelectValue placeholder="Filter by type" />
			</SelectTrigger>
			<SelectContent class="bg-stone-800 border-stone-700">
				<SelectItem value="all" class="text-stone-100 focus:bg-stone-700">All Types</SelectItem>
				<SelectItem value="image" class="text-stone-100 focus:bg-stone-700">Images</SelectItem>
				<SelectItem value="video" class="text-stone-100 focus:bg-stone-700">Videos</SelectItem>
				<SelectItem value="audio" class="text-stone-100 focus:bg-stone-700">Audio</SelectItem>
			</SelectContent>
		</Select>
	</div>

	<!-- Media Grid -->
	{#if filteredMedia.length === 0}
		<div class="text-center py-16 bg-stone-900/50 rounded-lg border border-stone-800">
			<Image class="h-12 w-12 text-stone-600 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-stone-300">No media files</h3>
			<p class="text-stone-500 mt-1">
				{typeFilter !== 'all' ? 'No files match your filter' : 'Upload your first media file'}
			</p>
			{#if typeFilter === 'all'}
				<Button
					onclick={() => (uploadDialogOpen = true)}
					class="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
				>
					<Plus class="mr-2 h-4 w-4" />
					Upload Media
				</Button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{#each filteredMedia as item}
				<button
					type="button"
					onclick={() => openDetail(item)}
					class="group relative aspect-square rounded-lg overflow-hidden bg-stone-800 border border-stone-700 hover:border-amber-500/50 transition-colors cursor-pointer"
				>
					{#if item.mediaType === 'image'}
						<img
							src={item.url}
							alt={item.altText || item.originalFilename}
							class="w-full h-full object-cover"
						/>
					{:else if item.mediaType === 'video'}
						<div class="w-full h-full flex items-center justify-center bg-stone-900">
							<Video class="h-12 w-12 text-stone-500" />
						</div>
					{:else}
						<div class="w-full h-full flex items-center justify-center bg-stone-900">
							<Music class="h-12 w-12 text-stone-500" />
						</div>
					{/if}

					<div
						class="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<div class="absolute bottom-0 left-0 right-0 p-3">
							<p class="text-sm text-stone-100 truncate">{item.originalFilename}</p>
							<p class="text-xs text-stone-400">{formatFileSize(item.size)}</p>
						</div>
					</div>

					<Badge
						variant="secondary"
						class="absolute top-2 right-2 bg-stone-900/80 text-stone-300 text-xs"
					>
						{item.mediaType}
					</Badge>
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- Upload Dialog -->
<Dialog bind:open={uploadDialogOpen}>
	<DialogContent class="bg-stone-900 border-stone-800">
		<DialogHeader>
			<DialogTitle class="text-stone-100">Upload Media</DialogTitle>
			<DialogDescription class="text-stone-400">
				Upload images, videos, or audio files to your media library.
			</DialogDescription>
		</DialogHeader>
		<div class="py-4">
			{#if uploading || uploadProgress.length > 0}
				<div class="space-y-2">
					{#each uploadProgress as progress}
						<div class="flex items-center gap-2 text-sm text-stone-300">
							{#if progress.startsWith('✓')}
								<span class="text-green-500">{progress}</span>
							{:else if progress.startsWith('✗')}
								<span class="text-red-500">{progress}</span>
							{:else}
								<Loader2 class="h-4 w-4 animate-spin" />
								<span>{progress}</span>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<label
					class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-stone-700 rounded-lg cursor-pointer hover:bg-stone-800/30 transition-colors"
				>
					<div class="flex flex-col items-center justify-center pt-5 pb-6">
						<Image class="w-10 h-10 mb-3 text-stone-500" />
						<p class="mb-2 text-sm text-stone-400">
							<span class="font-medium text-amber-500">Click to upload</span> or drag and drop
						</p>
						<p class="text-xs text-stone-500">Images, videos, or audio files</p>
					</div>
					<input
						type="file"
						class="hidden"
						accept="image/*,video/*,audio/*"
						multiple
						onchange={handleFileUpload}
					/>
				</label>
			{/if}
		</div>
	</DialogContent>
</Dialog>

<!-- Detail Dialog -->
<Dialog bind:open={detailDialogOpen}>
	<DialogContent class="bg-stone-900 border-stone-800 max-w-2xl">
		{#if selectedMedia}
			<DialogHeader>
				<DialogTitle class="text-stone-100 truncate">{selectedMedia.originalFilename}</DialogTitle>
			</DialogHeader>
			<div class="py-4 space-y-4">
				<!-- Preview -->
				<div class="rounded-lg overflow-hidden bg-stone-800">
					{#if selectedMedia.mediaType === 'image'}
						<img
							src={selectedMedia.url}
							alt={selectedMedia.altText || selectedMedia.originalFilename}
							class="w-full max-h-96 object-contain"
						/>
					{:else if selectedMedia.mediaType === 'video'}
						<video src={selectedMedia.url} controls class="w-full max-h-96">
							<track kind="captions" />
						</video>
					{:else}
						<audio src={selectedMedia.url} controls class="w-full p-4"></audio>
					{/if}
				</div>

				<!-- Details -->
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p class="text-stone-500">Type</p>
						<p class="text-stone-100 capitalize">{selectedMedia.mediaType}</p>
					</div>
					<div>
						<p class="text-stone-500">Size</p>
						<p class="text-stone-100">{formatFileSize(selectedMedia.size)}</p>
					</div>
					<div>
						<p class="text-stone-500">MIME Type</p>
						<p class="text-stone-100">{selectedMedia.mimeType}</p>
					</div>
					<div>
						<p class="text-stone-500">Uploaded</p>
						<p class="text-stone-100">
							{formatDistanceToNow(new Date(selectedMedia.createdAt), { addSuffix: true })}
						</p>
					</div>
				</div>

				<!-- URL -->
				<div>
					<p class="text-stone-500 text-sm mb-2">URL</p>
					<div class="flex items-center gap-2">
						<Input
							value={selectedMedia.url}
							readonly
							class="bg-stone-800 border-stone-700 text-stone-300 text-sm font-mono"
						/>
						<Button
							variant="outline"
							size="icon"
							onclick={copyUrl}
							class="border-stone-700 text-stone-300 hover:bg-stone-800"
						>
							<Copy class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
			<DialogFooter>
				<Button
					variant="outline"
					onclick={() => confirmDelete(selectedMedia!.id)}
					class="border-stone-700 text-red-400 hover:bg-red-900/20"
				>
					<Trash2 class="mr-2 h-4 w-4" />
					Delete
				</Button>
				<Button
					onclick={() => (detailDialogOpen = false)}
					class="bg-stone-700 hover:bg-stone-600 text-stone-100"
				>
					Close
				</Button>
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>

<!-- Delete Confirmation Dialog -->
<AlertDialog bind:open={deleteDialogOpen}>
	<AlertDialogContent class="bg-stone-900 border-stone-800">
		<AlertDialogHeader>
			<AlertDialogTitle class="text-stone-100">Delete Media</AlertDialogTitle>
			<AlertDialogDescription class="text-stone-400">
				Are you sure you want to delete this file? This action cannot be undone.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel class="bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700">
				Cancel
			</AlertDialogCancel>
			<AlertDialogAction onclick={handleDelete} class="bg-red-600 hover:bg-red-700 text-white">
				Delete
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

