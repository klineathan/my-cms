<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
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
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
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
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import FileText from '@lucide/svelte/icons/file-text';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { formatDistanceToNow } from 'date-fns';

	let { data } = $props();

	let searchQuery = $state($page.url.searchParams.get('search') || '');
	let statusFilter = $state($page.url.searchParams.get('status') || 'all');
	let sortBy = $state($page.url.searchParams.get('sort') || 'createdAt');
	let sortOrder = $state($page.url.searchParams.get('order') || 'desc');
	let deleteDialogOpen = $state(false);
	let postToDelete = $state<string | null>(null);

	function updateFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (sortBy !== 'createdAt') params.set('sort', sortBy);
		if (sortOrder !== 'desc') params.set('order', sortOrder);
		params.set('page', '1');
		goto(`/posts?${params.toString()}`);
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		updateFilters();
	}

	function handleStatusChange(value: string | undefined) {
		if (value) {
			statusFilter = value;
			updateFilters();
		}
	}

	function handleSortChange(value: string | undefined) {
		if (value) {
			sortBy = value;
			updateFilters();
		}
	}

	function toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		updateFilters();
	}

	function confirmDelete(postId: string) {
		postToDelete = postId;
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (!postToDelete) return;

		const response = await fetch(`/posts/${postToDelete}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			goto('/posts', { invalidateAll: true });
		}

		deleteDialogOpen = false;
		postToDelete = null;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'published':
				return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
			case 'draft':
				return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
			case 'archived':
				return 'bg-stone-500/10 text-stone-500 hover:bg-stone-500/20';
			default:
				return 'bg-stone-500/10 text-stone-500';
		}
	}

	function getPageUrl(pageNum: number) {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (sortBy !== 'createdAt') params.set('sort', sortBy);
		if (sortOrder !== 'desc') params.set('order', sortOrder);
		params.set('page', String(pageNum));
		return `/posts?${params.toString()}`;
	}
</script>

<svelte:head>
	<title>Posts | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-stone-100">Posts</h1>
			<p class="text-stone-400 mt-1">Manage your timeline posts</p>
		</div>
		<Button
			href="/posts/new"
			class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
		>
			<Plus class="mr-2 h-4 w-4" />
			New Post
		</Button>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4">
		<form onsubmit={handleSearch} class="flex-1 max-w-md">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
				<Input
					type="search"
					placeholder="Search posts..."
					bind:value={searchQuery}
					class="pl-10 bg-stone-800/50 border-stone-700 text-stone-100 placeholder:text-stone-500"
				/>
			</div>
		</form>

		<div class="flex gap-2">
			<Select type="single" value={statusFilter} onValueChange={handleStatusChange}>
				<SelectTrigger class="w-[140px] bg-stone-800/50 border-stone-700 text-stone-100">
					<SelectValue placeholder="Status">
						{statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
					</SelectValue>
				</SelectTrigger>
				<SelectContent class="bg-stone-800 border-stone-700">
					<SelectItem value="all" class="text-stone-100 focus:bg-stone-700">All Status</SelectItem>
					<SelectItem value="published" class="text-stone-100 focus:bg-stone-700"
						>Published</SelectItem
					>
					<SelectItem value="draft" class="text-stone-100 focus:bg-stone-700">Draft</SelectItem>
					<SelectItem value="archived" class="text-stone-100 focus:bg-stone-700"
						>Archived</SelectItem
					>
				</SelectContent>
			</Select>

			<Select type="single" value={sortBy} onValueChange={handleSortChange}>
				<SelectTrigger class="w-[140px] bg-stone-800/50 border-stone-700 text-stone-100">
					<SelectValue placeholder="Sort by">
						{sortBy === 'createdAt' ? 'Created' : sortBy === 'updatedAt' ? 'Updated' : 'Title'}
					</SelectValue>
				</SelectTrigger>
				<SelectContent class="bg-stone-800 border-stone-700">
					<SelectItem value="createdAt" class="text-stone-100 focus:bg-stone-700"
						>Created</SelectItem
					>
					<SelectItem value="updatedAt" class="text-stone-100 focus:bg-stone-700"
						>Updated</SelectItem
					>
					<SelectItem value="title" class="text-stone-100 focus:bg-stone-700">Title</SelectItem>
				</SelectContent>
			</Select>

			<Button
				variant="outline"
				size="icon"
				onclick={toggleSortOrder}
				class="border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
			>
				<ArrowUpDown class="h-4 w-4" />
			</Button>
		</div>
	</div>

	<!-- Posts Table -->
	{#if data.posts.length === 0}
		<div class="text-center py-16 bg-stone-900/50 rounded-lg border border-stone-800">
			<FileText class="h-12 w-12 text-stone-600 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-stone-300">No posts found</h3>
			<p class="text-stone-500 mt-1">
				{searchQuery || statusFilter !== 'all'
					? 'Try adjusting your filters'
					: 'Create your first post to get started'}
			</p>
			{#if !searchQuery && statusFilter === 'all'}
				<Button href="/posts/new" class="mt-4 bg-amber-500 hover:bg-amber-600 text-white">
					<Plus class="mr-2 h-4 w-4" />
					Create Post
				</Button>
			{/if}
		</div>
	{:else}
		<div class="rounded-lg border border-stone-800 overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow class="border-stone-800 hover:bg-stone-800/50">
						<TableHead class="text-stone-400">Title</TableHead>
						<TableHead class="text-stone-400">Status</TableHead>
						<TableHead class="text-stone-400">Created</TableHead>
						<TableHead class="text-stone-400">Updated</TableHead>
						<TableHead class="text-stone-400 w-[50px]"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each data.posts as post}
						<TableRow class="border-stone-800 hover:bg-stone-800/50">
							<TableCell>
								<a
									href="/posts/{post.id}"
									class="font-medium text-stone-100 hover:text-amber-500 transition-colors"
								>
									{post.title || 'Untitled Post'}
								</a>
								{#if post.excerpt}
									<p class="text-sm text-stone-500 mt-1 line-clamp-1">{post.excerpt}</p>
								{/if}
							</TableCell>
							<TableCell>
								<Badge variant="secondary" class={getStatusBadge(post.status)}>
									{post.status}
								</Badge>
							</TableCell>
							<TableCell class="text-stone-400">
								{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
							</TableCell>
							<TableCell class="text-stone-400">
								{formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
							</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger>
										<Button
											variant="ghost"
											size="icon"
											class="text-stone-400 hover:text-stone-100"
										>
											<MoreHorizontal class="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" class="bg-stone-800 border-stone-700">
										<DropdownMenuItem
											class="text-stone-300 focus:bg-stone-700 focus:text-stone-100 cursor-pointer"
											onclick={() => goto(`/posts/${post.id}`)}
										>
											<Eye class="mr-2 h-4 w-4" />
											View
										</DropdownMenuItem>
										<DropdownMenuItem
											class="text-stone-300 focus:bg-stone-700 focus:text-stone-100 cursor-pointer"
											onclick={() => goto(`/posts/${post.id}/edit`)}
										>
											<Pencil class="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											class="text-red-400 focus:bg-red-900/50 focus:text-red-300 cursor-pointer"
											onclick={() => confirmDelete(post.id)}
										>
											<Trash2 class="mr-2 h-4 w-4" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="flex justify-center gap-2">
				{#if data.currentPage > 1}
					<Button
						variant="outline"
						size="sm"
						href={getPageUrl(data.currentPage - 1)}
						class="border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
					>
						<ChevronLeft class="h-4 w-4 mr-1" />
						Previous
					</Button>
				{/if}

				<div class="flex items-center gap-1">
					{#each Array(data.totalPages) as _, i}
						<Button
							variant={data.currentPage === i + 1 ? 'default' : 'outline'}
							size="icon"
							href={getPageUrl(i + 1)}
							class={data.currentPage === i + 1
								? 'bg-amber-500 text-white hover:bg-amber-600'
								: 'border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-stone-100'}
						>
							{i + 1}
						</Button>
					{/each}
				</div>

				{#if data.currentPage < data.totalPages}
					<Button
						variant="outline"
						size="sm"
						href={getPageUrl(data.currentPage + 1)}
						class="border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
					>
						Next
						<ChevronRight class="h-4 w-4 ml-1" />
					</Button>
				{/if}
			</div>
		{/if}
	{/if}
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
			<AlertDialogCancel class="bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
				>Cancel</AlertDialogCancel
			>
			<AlertDialogAction onclick={handleDelete} class="bg-red-600 hover:bg-red-700 text-white"
				>Delete</AlertDialogAction
			>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
