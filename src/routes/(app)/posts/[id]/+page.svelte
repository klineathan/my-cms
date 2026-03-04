<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
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
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Reply from '@lucide/svelte/icons/reply';
	import Send from '@lucide/svelte/icons/send';
	import { format } from 'date-fns';

	interface Comment {
		id: string;
		postId: string;
		parentId: string | null;
		authorName: string;
		authorEmail: string;
		content: string;
		isOwner: boolean;
		createdAt: string | Date;
	}

	let { data } = $props();
	let deleteDialogOpen = $state(false);
	let deleteCommentId = $state<string | null>(null);
	let deleteCommentDialogOpen = $state(false);
	let replyingTo = $state<string | null>(null);
	let replyContent = $state('');
	let replySubmitting = $state(false);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'published':
				return 'bg-green-500/10 text-green-500';
			case 'draft':
				return 'bg-amber-500/10 text-amber-500';
			case 'archived':
				return 'bg-stone-500/10 text-stone-500';
			default:
				return 'bg-stone-500/10 text-stone-500';
		}
	}

	function topLevelComments(allComments: Comment[]): Comment[] {
		return allComments.filter((c) => !c.parentId);
	}

	function getReplies(allComments: Comment[], parentId: string): Comment[] {
		return allComments.filter((c) => c.parentId === parentId);
	}

	async function handleDelete() {
		const response = await fetch(`/posts/${data.post.id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			toast.success('Post deleted');
			goto('/posts');
		} else {
			toast.error('Failed to delete post');
		}

		deleteDialogOpen = false;
	}

	async function handleDeleteComment() {
		if (!deleteCommentId) return;

		const response = await fetch(`/posts/${data.post.id}/comments/${deleteCommentId}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			toast.success('Comment deleted');
			await invalidateAll();
		} else {
			toast.error('Failed to delete comment');
		}

		deleteCommentDialogOpen = false;
		deleteCommentId = null;
	}

	async function handleReply(parentId: string) {
		if (!replyContent.trim()) return;
		replySubmitting = true;

		const response = await fetch(`/posts/${data.post.id}/comments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				parentId,
				content: replyContent.trim()
			})
		});

		if (response.ok) {
			toast.success('Reply posted');
			replyContent = '';
			replyingTo = null;
			await invalidateAll();
		} else {
			toast.error('Failed to post reply');
		}

		replySubmitting = false;
	}
</script>

<svelte:head>
	<title>{data.post.title || 'Untitled Post'} | My CMS</title>
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
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-bold text-stone-100">
						{data.post.title || 'Untitled Post'}
					</h1>
					<Badge variant="secondary" class={getStatusBadge(data.post.status)}>
						{data.post.status}
					</Badge>
				</div>
				<div class="flex items-center gap-4 mt-2 text-sm text-stone-400">
					<span class="flex items-center gap-1">
						<Calendar class="h-4 w-4" />
						Created {format(new Date(data.post.createdAt), 'MMM d, yyyy')}
					</span>
					<span class="flex items-center gap-1">
						<Clock class="h-4 w-4" />
						Updated {format(new Date(data.post.updatedAt), 'MMM d, yyyy h:mm a')}
					</span>
				</div>
			</div>
		</div>
		<div class="flex gap-2">
			<Button
				variant="outline"
				onclick={() => (deleteDialogOpen = true)}
				class="border-stone-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
			>
				<Trash2 class="mr-2 h-4 w-4" />
				Delete
			</Button>
			<Button
				href="/posts/{data.post.id}/edit"
				class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
			>
				<Pencil class="mr-2 h-4 w-4" />
				Edit
			</Button>
		</div>
	</div>

	<!-- Excerpt -->
	{#if data.post.excerpt}
		<Card class="bg-stone-900/50 border-stone-800">
			<CardContent class="pt-6">
				<p class="text-stone-400 italic">{data.post.excerpt}</p>
			</CardContent>
		</Card>
	{/if}

	<!-- Content -->
	<Card class="bg-stone-900/50 border-stone-800">
		<CardContent class="pt-6">
			<div class="post-content text-stone-100">
				{@html data.post.content || '<p class="text-stone-500">No content</p>'}
			</div>
		</CardContent>
	</Card>

	<!-- Media -->
	{#if data.media && data.media.length > 0}
		<Card class="bg-stone-900/50 border-stone-800">
			<CardContent class="pt-6">
				<h3 class="text-lg font-semibold text-stone-100 mb-4">Media</h3>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each data.media as item}
						{#if item.mediaType === 'image'}
							<img
								src={item.url}
								alt={item.altText || 'Post media'}
								class="w-full aspect-square object-cover rounded-lg"
							/>
						{:else if item.mediaType === 'video'}
							<video
								src={item.url}
								controls
								class="w-full aspect-video object-cover rounded-lg"
							>
								<track kind="captions" />
							</video>
						{:else if item.mediaType === 'audio'}
							<div class="flex items-center justify-center bg-stone-800 rounded-lg p-4 aspect-square">
								<audio src={item.url} controls class="w-full"></audio>
							</div>
						{/if}
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Comments -->
	<Card class="bg-stone-900/50 border-stone-800">
		<CardContent class="pt-6">
			<div class="flex items-center gap-2 mb-4">
				<MessageSquare class="h-5 w-5 text-stone-400" />
				<h3 class="text-lg font-semibold text-stone-100">
					Comments ({data.comments.length})
				</h3>
			</div>

			{#if data.comments.length === 0}
				<p class="text-stone-500 text-sm italic">No comments yet.</p>
			{:else}
				<div class="space-y-4">
					{#each topLevelComments(data.comments) as comment (comment.id)}
						<div class="border border-stone-800 rounded-lg p-4">
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<span class="font-medium text-stone-200 text-sm">{comment.authorName}</span>
										<span class="text-stone-500 text-xs">{comment.authorEmail}</span>
										<span class="text-stone-600 text-xs">
											{format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
										</span>
									</div>
									<p class="text-stone-300 text-sm whitespace-pre-wrap">{comment.content}</p>
								</div>
								<div class="flex gap-1 flex-shrink-0">
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 text-stone-500 hover:text-stone-200"
										onclick={() => {
											replyingTo = replyingTo === comment.id ? null : comment.id;
											replyContent = '';
										}}
									>
										<Reply class="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 text-stone-500 hover:text-red-400"
										onclick={() => {
											deleteCommentId = comment.id;
											deleteCommentDialogOpen = true;
										}}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>

							{#if replyingTo === comment.id}
								<div class="mt-3 flex gap-2">
									<textarea
										class="flex-1 bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-200 placeholder:text-stone-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50"
										placeholder="Write a reply..."
										rows="2"
										bind:value={replyContent}
									></textarea>
									<Button
										size="icon"
										class="h-auto bg-amber-600 hover:bg-amber-700 text-white self-end"
										disabled={!replyContent.trim() || replySubmitting}
										onclick={() => handleReply(comment.id)}
									>
										<Send class="h-4 w-4" />
									</Button>
								</div>
							{/if}

							{#each getReplies(data.comments, comment.id) as reply (reply.id)}
								<div class="mt-3 ml-6 border-l-2 border-amber-500/30 pl-4">
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 mb-1">
												<span class="font-medium text-sm" class:text-amber-400={reply.isOwner} class:text-stone-200={!reply.isOwner}>
													{reply.authorName}
												</span>
												{#if reply.isOwner}
													<Badge variant="secondary" class="bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0">
														owner
													</Badge>
												{/if}
												<span class="text-stone-600 text-xs">
													{format(new Date(reply.createdAt), 'MMM d, yyyy h:mm a')}
												</span>
											</div>
											<p class="text-stone-300 text-sm whitespace-pre-wrap">{reply.content}</p>
										</div>
										<Button
											variant="ghost"
											size="icon"
											class="h-7 w-7 text-stone-500 hover:text-red-400 flex-shrink-0"
											onclick={() => {
												deleteCommentId = reply.id;
												deleteCommentDialogOpen = true;
											}}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog bind:open={deleteDialogOpen}>
	<AlertDialogContent class="bg-stone-900 border-stone-800">
		<AlertDialogHeader>
			<AlertDialogTitle class="text-stone-100">Delete Post</AlertDialogTitle>
			<AlertDialogDescription class="text-stone-400">
				Are you sure you want to delete this post? This action cannot be undone.
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

<!-- Delete Comment Confirmation Dialog -->
<AlertDialog bind:open={deleteCommentDialogOpen}>
	<AlertDialogContent class="bg-stone-900 border-stone-800">
		<AlertDialogHeader>
			<AlertDialogTitle class="text-stone-100">Delete Comment</AlertDialogTitle>
			<AlertDialogDescription class="text-stone-400">
				Are you sure you want to delete this comment? Any replies to it will also be removed.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel class="bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700">
				Cancel
			</AlertDialogCancel>
			<AlertDialogAction onclick={handleDeleteComment} class="bg-red-600 hover:bg-red-700 text-white">
				Delete
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

<style>
	:global(.post-content) {
		color: #fafaf9;
		line-height: 1.75;
	}

	:global(.post-content p) {
		margin-bottom: 1rem;
	}

	:global(.post-content h1) {
		font-size: 1.875rem;
		font-weight: 700;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #fafaf9;
	}

	:global(.post-content h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		color: #fafaf9;
	}

	:global(.post-content h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		color: #fafaf9;
	}

	:global(.post-content a) {
		color: #f59e0b;
		text-decoration: underline;
	}

	:global(.post-content a:hover) {
		color: #fbbf24;
	}

	:global(.post-content ul),
	:global(.post-content ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}

	:global(.post-content li) {
		margin: 0.25rem 0;
	}

	:global(.post-content blockquote) {
		border-left: 3px solid #f59e0b;
		padding-left: 1rem;
		margin-left: 0;
		margin-bottom: 1rem;
		color: #a8a29e;
		font-style: italic;
	}

	:global(.post-content pre) {
		background: #1c1917;
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	:global(.post-content code) {
		background: #292524;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
		color: #fbbf24;
	}

	:global(.post-content pre code) {
		background: none;
		padding: 0;
		color: #e7e5e4;
	}

	:global(.post-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	:global(.post-content hr) {
		border: none;
		border-top: 1px solid #44403c;
		margin: 1.5rem 0;
	}

	:global(.post-content iframe) {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
</style>

