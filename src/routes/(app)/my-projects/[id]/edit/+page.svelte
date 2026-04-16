<script lang="ts">
	import { goto } from '$app/navigation';
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
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import PostEditor from '$lib/components/PostEditor.svelte';
	import { toast } from 'svelte-sonner';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Save from '@lucide/svelte/icons/save';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';

	let { data } = $props();

	let title = $state(data.project.title || '');
	let description = $state(data.project.description || '');
	let content = $state(data.project.content || '');
	let contentJson = $state<object | null>(data.project.contentJson as object | null);
	let url = $state(data.project.url || '');
	let thumbnailId = $state(data.project.mediaId);
	let orderStr = $state(String(data.project.order));
	let isVisible = $state(data.project.isVisible);
	let saving = $state(false);

	let existingMediaIds = $state<string[]>(data.galleryMedia.map((m: { id: string }) => m.id));
	let newMediaFiles = $state<File[]>([]);
	let newMediaPreviewUrls = $state<{ url: string; type: 'image' | 'video' | 'audio' }[]>([]);

	function handleEditorUpdate(html: string, json: object) {
		content = html;
		contentJson = json;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			const files = Array.from(input.files);
			newMediaFiles = [...newMediaFiles, ...files];
			files.forEach((file) => {
				const objUrl = URL.createObjectURL(file);
				let type: 'image' | 'video' | 'audio' = 'image';
				if (file.type.startsWith('video/')) type = 'video';
				else if (file.type.startsWith('audio/')) type = 'audio';
				newMediaPreviewUrls = [...newMediaPreviewUrls, { url: objUrl, type }];
			});
		}
	}

	function removeExistingMedia(mediaId: string) {
		existingMediaIds = existingMediaIds.filter((id) => id !== mediaId);
	}

	function removeNewMedia(index: number) {
		URL.revokeObjectURL(newMediaPreviewUrls[index].url);
		newMediaFiles = newMediaFiles.filter((_, i) => i !== index);
		newMediaPreviewUrls = newMediaPreviewUrls.filter((_, i) => i !== index);
	}

	async function handleSave() {
		if (!title.trim()) {
			toast.error('Title is required');
			return;
		}
		if (!thumbnailId) {
			toast.error('Please select a thumbnail image');
			return;
		}

		saving = true;
		try {
			const uploadedMediaIds: string[] = [];
			for (const file of newMediaFiles) {
				const formData = new FormData();
				formData.append('file', file);
				const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
				if (uploadRes.ok) {
					const { mediaId } = await uploadRes.json();
					uploadedMediaIds.push(mediaId);
				}
			}

			const allMediaIds = [...existingMediaIds, ...uploadedMediaIds];
			const orderNum = parseInt(orderStr, 10);

			const response = await fetch(`/my-projects/${data.project.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mediaId: thumbnailId,
					title: title.trim(),
					description: description.trim() || null,
					content,
					contentJson,
					url: url.trim() || null,
					order: Number.isNaN(orderNum) ? 0 : orderNum,
					isVisible,
					mediaIds: allMediaIds
				})
			});

			if (response.ok) {
				toast.success('Project updated');
				goto('/my-projects');
			} else {
				const err = await response.json();
				toast.error(err.message || 'Failed to update project');
			}
		} catch {
			toast.error('An error occurred while saving');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Project | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" href="/my-projects" class="text-stone-400 hover:text-stone-100">
				<ArrowLeft class="h-5 w-5" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold text-stone-100">Edit Project</h1>
				<p class="text-stone-400 mt-1">Update project details</p>
			</div>
		</div>
		<Button
			onclick={handleSave}
			disabled={saving}
			class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
		>
			{#if saving}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{:else}
				<Save class="mr-2 h-4 w-4" />
			{/if}
			Save
		</Button>
	</div>

	<div class="grid gap-6">
		<div class="space-y-2">
			<Label for="title" class="text-stone-300">Title</Label>
			<Input
				id="title"
				bind:value={title}
				placeholder="Project title..."
				class="bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500 text-lg"
			/>
		</div>

		<div class="space-y-2">
			<Label class="text-stone-300">Content</Label>
			<PostEditor {content} {contentJson} onUpdate={handleEditorUpdate} placeholder="Describe the project..." />
		</div>

		<Card class="bg-stone-900/50 border-stone-800">
			<CardHeader>
				<CardTitle class="text-stone-100 text-lg flex items-center gap-2">
					<ImageIcon class="h-5 w-5 text-amber-500" />
					Gallery Media
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#if data.galleryMedia.length > 0 || newMediaPreviewUrls.length > 0}
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{#each data.galleryMedia as item}
								{#if existingMediaIds.includes(item.id)}
									<div class="relative group">
										{#if item.mediaType === 'image'}
											<img src={item.url} alt={item.altText || 'Project media'} class="w-full aspect-square object-cover rounded-lg" />
										{:else if item.mediaType === 'video'}
											<video src={item.url} class="w-full aspect-square object-cover rounded-lg">
												<track kind="captions" />
											</video>
										{:else}
											<div class="w-full aspect-square bg-stone-800 rounded-lg flex items-center justify-center">
												<span class="text-stone-500">Audio</span>
											</div>
										{/if}
										<button
											type="button"
											onclick={() => removeExistingMedia(item.id)}
											class="absolute top-2 right-2 p-1 rounded-full bg-stone-900/80 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
										>
											<X class="h-4 w-4" />
										</button>
									</div>
								{/if}
							{/each}

							{#each newMediaPreviewUrls as item, index}
								<div class="relative group">
									{#if item.type === 'image'}
										<img src={item.url} alt="Upload preview" class="w-full aspect-square object-cover rounded-lg" />
									{:else if item.type === 'video'}
										<video src={item.url} class="w-full aspect-square object-cover rounded-lg" muted>
											<track kind="captions" />
										</video>
									{:else}
										<div class="w-full aspect-square bg-stone-800 rounded-lg flex items-center justify-center">
											<span class="text-stone-400 text-sm">Audio file</span>
										</div>
									{/if}
									<button
										type="button"
										onclick={() => removeNewMedia(index)}
										class="absolute top-2 right-2 p-1 rounded-full bg-stone-900/80 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
									>
										<X class="h-4 w-4" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-700 rounded-lg cursor-pointer hover:bg-stone-800/30 transition-colors">
						<div class="flex flex-col items-center justify-center pt-5 pb-6">
							<ImageIcon class="w-8 h-8 mb-2 text-stone-500" />
							<p class="mb-1 text-sm text-stone-400">
								<span class="font-medium text-amber-500">Click to upload</span> gallery media
							</p>
							<p class="text-xs text-stone-500">Images, videos, or audio files</p>
						</div>
						<input type="file" class="hidden" accept="image/*,video/*,audio/*" multiple onchange={handleFileSelect} />
					</label>
				</div>
			</CardContent>
		</Card>

		<div class="space-y-2">
			<Label for="thumbnail" class="text-stone-300">Thumbnail (homepage preview)</Label>
			<Select type="single" value={thumbnailId} onValueChange={(v) => (thumbnailId = v ?? '')}>
				<SelectTrigger id="thumbnail" class="bg-stone-800 border-stone-700 text-stone-100">
					<SelectValue placeholder="Select thumbnail" />
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

		<div class="space-y-2">
			<Label for="url" class="text-stone-300">External Link (optional)</Label>
			<Input
				id="url"
				bind:value={url}
				placeholder="https://..."
				class="bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500"
			/>
		</div>

		<div class="space-y-2">
			<Label for="description" class="text-stone-300">Excerpt (optional)</Label>
			<Textarea
				id="description"
				bind:value={description}
				placeholder="A brief summary shown on the homepage preview..."
				rows={3}
				class="bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500 resize-none"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label for="order" class="text-stone-300">Order</Label>
				<Input
					id="order"
					type="number"
					bind:value={orderStr}
					min="0"
					class="bg-stone-800/50 border-stone-700 text-stone-100"
				/>
			</div>
			<div class="space-y-2">
				<Label for="visible" class="text-stone-300">Visible</Label>
				<Select type="single" value={isVisible ? 'yes' : 'no'} onValueChange={(v) => (isVisible = v === 'yes')}>
					<SelectTrigger id="visible" class="bg-stone-800 border-stone-700 text-stone-100">
						<SelectValue />
					</SelectTrigger>
					<SelectContent class="bg-stone-800 border-stone-700">
						<SelectItem value="yes" class="text-stone-100 focus:bg-stone-700">Yes</SelectItem>
						<SelectItem value="no" class="text-stone-100 focus:bg-stone-700">No</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	</div>
</div>
