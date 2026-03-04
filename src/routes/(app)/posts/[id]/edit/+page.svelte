<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import PostEditor from '$lib/components/PostEditor.svelte';
	import { toast } from 'svelte-sonner';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Save from '@lucide/svelte/icons/save';
	import Send from '@lucide/svelte/icons/send';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';

	let { data } = $props();

	let title = $state(data.post.title || '');
	let excerpt = $state(data.post.excerpt || '');
	let content = $state(data.post.content || '');
	let contentJson = $state<object | null>(data.post.contentJson as object | null);
	let status = $state<'draft' | 'published' | 'archived'>(data.post.status);
	let saving = $state(false);
	let existingMediaIds = $state<string[]>(data.media.map((m: { id: string }) => m.id));
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
				const url = URL.createObjectURL(file);
				let type: 'image' | 'video' | 'audio' = 'image';
				if (file.type.startsWith('video/')) {
					type = 'video';
				} else if (file.type.startsWith('audio/')) {
					type = 'audio';
				}
				newMediaPreviewUrls = [...newMediaPreviewUrls, { url, type }];
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

	async function handleSave(publishStatus: 'draft' | 'published' | 'archived') {
		saving = true;

		try {
			// Upload new media files
			const uploadedMediaIds: string[] = [];

			for (const file of newMediaFiles) {
				const formData = new FormData();
				formData.append('file', file);

				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (uploadResponse.ok) {
					const { mediaId } = await uploadResponse.json();
					uploadedMediaIds.push(mediaId);
				}
			}

			// Combine existing and new media
			const allMediaIds = [...existingMediaIds, ...uploadedMediaIds];

			// Update the post
			const response = await fetch(`/posts/${data.post.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: title || null,
					excerpt: excerpt || null,
					content,
					contentJson,
					status: publishStatus,
					mediaIds: allMediaIds
				})
			});

			if (response.ok) {
				toast.success(
					publishStatus === 'published' ? 'Post published!' : 'Post saved'
				);
				goto(`/posts/${data.post.id}`);
			} else {
				const error = await response.json();
				toast.error(error.message || 'Failed to save post');
			}
		} catch (err) {
			toast.error('An error occurred while saving');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Post | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				href="/posts/{data.post.id}"
				class="text-stone-400 hover:text-stone-100"
			>
				<ArrowLeft class="h-5 w-5" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold text-stone-100">Edit Post</h1>
				<p class="text-stone-400 mt-1">Update your timeline post</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Button
				variant="outline"
				onclick={() => handleSave('draft')}
				disabled={saving}
				class="border-stone-700 text-stone-300 hover:bg-stone-800"
			>
				{#if saving}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<Save class="mr-2 h-4 w-4" />
				{/if}
				Save Draft
			</Button>
			<Button
				onclick={() => handleSave('published')}
				disabled={saving}
				class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
			>
				{#if saving}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<Send class="mr-2 h-4 w-4" />
				{/if}
				{status === 'published' ? 'Update' : 'Publish'}
			</Button>
		</div>
	</div>

	<!-- Post Form -->
	<div class="grid gap-6">
		<!-- Title -->
		<div class="space-y-2">
			<Label for="title" class="text-stone-300">Title (optional)</Label>
			<Input
				id="title"
				bind:value={title}
				placeholder="Give your post a title..."
				class="bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500 text-lg"
			/>
		</div>

		<!-- Content Editor -->
		<div class="space-y-2">
			<Label class="text-stone-300">Content</Label>
			<PostEditor
				{content}
				{contentJson}
				onUpdate={handleEditorUpdate}
				placeholder="What's on your mind?"
			/>
		</div>

		<!-- Media Upload -->
		<Card class="bg-stone-900/50 border-stone-800">
			<CardHeader>
				<CardTitle class="text-stone-100 text-lg flex items-center gap-2">
					<ImageIcon class="h-5 w-5 text-amber-500" />
					Media
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<!-- Existing Media -->
					{#if data.media.length > 0 || newMediaPreviewUrls.length > 0}
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{#each data.media as item}
								{#if existingMediaIds.includes(item.id)}
									<div class="relative group">
										{#if item.mediaType === 'image'}
											<img
												src={item.url}
												alt={item.altText || 'Post media'}
												class="w-full aspect-square object-cover rounded-lg"
											/>
										{:else if item.mediaType === 'video'}
											<video
												src={item.url}
												class="w-full aspect-square object-cover rounded-lg"
											/>
										{:else}
											<div
												class="w-full aspect-square bg-stone-800 rounded-lg flex items-center justify-center"
											>
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

							{#each newMediaPreviewUrls as media, index}
								<div class="relative group">
									{#if media.type === 'image'}
										<img
											src={media.url}
											alt="Upload preview"
											class="w-full aspect-square object-cover rounded-lg"
										/>
									{:else if media.type === 'video'}
										<video
											src={media.url}
											class="w-full aspect-square object-cover rounded-lg"
											muted
										>
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

					<label
						class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-700 rounded-lg cursor-pointer hover:bg-stone-800/30 transition-colors"
					>
						<div class="flex flex-col items-center justify-center pt-5 pb-6">
							<ImageIcon class="w-8 h-8 mb-2 text-stone-500" />
							<p class="mb-1 text-sm text-stone-400">
								<span class="font-medium text-amber-500">Click to upload</span> or drag and drop
							</p>
							<p class="text-xs text-stone-500">Images, videos, or audio files</p>
						</div>
						<input
							type="file"
							class="hidden"
							accept="image/*,video/*,audio/*"
							multiple
							onchange={handleFileSelect}
						/>
					</label>
				</div>
			</CardContent>
		</Card>

		<!-- Excerpt -->
		<div class="space-y-2">
			<Label for="excerpt" class="text-stone-300">Excerpt (optional)</Label>
			<Textarea
				id="excerpt"
				bind:value={excerpt}
				placeholder="A brief summary of your post..."
				rows={3}
				class="bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500 resize-none"
			/>
		</div>
	</div>
</div>

