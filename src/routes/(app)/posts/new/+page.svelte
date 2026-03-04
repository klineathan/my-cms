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
	import Send from '@lucide/svelte/icons/send';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';

	let title = $state('');
	let excerpt = $state('');
	let content = $state('');
	let contentJson = $state<object | null>(null);
	let status = $state<'draft' | 'published'>('draft');
	let saving = $state(false);
	let mediaFiles = $state<File[]>([]);
	let mediaPreviewUrls = $state<{ url: string; type: 'image' | 'video' | 'audio' }[]>([]);

	function handleEditorUpdate(html: string, json: object) {
		content = html;
		contentJson = json;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			const newFiles = Array.from(input.files);
			mediaFiles = [...mediaFiles, ...newFiles];
			
			// Create preview URLs with type info
			newFiles.forEach(file => {
				const url = URL.createObjectURL(file);
				let type: 'image' | 'video' | 'audio' = 'image';
				if (file.type.startsWith('video/')) {
					type = 'video';
				} else if (file.type.startsWith('audio/')) {
					type = 'audio';
				}
				mediaPreviewUrls = [...mediaPreviewUrls, { url, type }];
			});
		}
	}

	function removeMedia(index: number) {
		URL.revokeObjectURL(mediaPreviewUrls[index].url);
		mediaFiles = mediaFiles.filter((_, i) => i !== index);
		mediaPreviewUrls = mediaPreviewUrls.filter((_, i) => i !== index);
	}

	async function handleSave(publishStatus: 'draft' | 'published') {
		saving = true;

		try {
			// First, upload any media files
			const uploadedMedia: string[] = [];
			
			for (const file of mediaFiles) {
				const formData = new FormData();
				formData.append('file', file);
				
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (uploadResponse.ok) {
					const { mediaId } = await uploadResponse.json();
					uploadedMedia.push(mediaId);
				}
			}

			// Create the post
			const response = await fetch('/posts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: title || null,
					excerpt: excerpt || null,
					content,
					contentJson,
					status: publishStatus,
					mediaIds: uploadedMedia
				})
			});

			if (response.ok) {
				const { id } = await response.json();
				toast.success(publishStatus === 'published' ? 'Post published!' : 'Post saved as draft');
				goto(`/posts/${id}`);
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
	<title>New Post | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				href="/posts"
				class="text-stone-400 hover:text-stone-100"
			>
				<ArrowLeft class="h-5 w-5" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold text-stone-100">New Post</h1>
				<p class="text-stone-400 mt-1">Create a new timeline post</p>
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
				Publish
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
			<PostEditor onUpdate={handleEditorUpdate} placeholder="What's on your mind?" />
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
					{#if mediaPreviewUrls.length > 0}
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{#each mediaPreviewUrls as media, index}
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
										onclick={() => removeMedia(index)}
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

