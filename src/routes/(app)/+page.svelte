<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import FileText from '@lucide/svelte/icons/file-text';
	import Image from '@lucide/svelte/icons/image';
	import Eye from '@lucide/svelte/icons/eye';
	import Plus from '@lucide/svelte/icons/plus';
	import TrendingUp from '@lucide/svelte/icons/trending-up';

	let { data } = $props();

	const stats = $derived([
		{
			name: 'Total Posts',
			value: data.stats.totalPosts,
			icon: FileText,
			change: '+12%',
			changeType: 'positive'
		},
		{
			name: 'Published',
			value: data.stats.publishedPosts,
			icon: Eye,
			change: '+8%',
			changeType: 'positive'
		},
		{
			name: 'Drafts',
			value: data.stats.draftPosts,
			icon: FileText,
			change: '-2%',
			changeType: 'neutral'
		},
		{
			name: 'Media Files',
			value: data.stats.totalMedia,
			icon: Image,
			change: '+24%',
			changeType: 'positive'
		}
	]);
</script>

<svelte:head>
	<title>Dashboard | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-stone-100">Dashboard</h1>
			<p class="text-stone-400 mt-1">Welcome back! Here's what's happening with your content.</p>
		</div>
		<Button href="/posts/new" class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
			<Plus class="mr-2 h-4 w-4" />
			New Post
		</Button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each stats as stat}
			<Card class="bg-stone-900/50 border-stone-800">
				<CardContent class="pt-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-stone-400">{stat.name}</p>
							<p class="text-2xl font-bold text-stone-100 mt-1">{stat.value}</p>
						</div>
						<div class="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center">
							<stat.icon class="h-6 w-6 text-amber-500" />
						</div>
					</div>
					<div class="mt-4 flex items-center text-sm">
						<TrendingUp class="h-4 w-4 mr-1 {stat.changeType === 'positive' ? 'text-green-500' : 'text-stone-500'}" />
						<span class="{stat.changeType === 'positive' ? 'text-green-500' : 'text-stone-500'}">{stat.change}</span>
						<span class="text-stone-500 ml-2">from last month</span>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Recent Posts -->
	<Card class="bg-stone-900/50 border-stone-800">
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-stone-100">Recent Posts</CardTitle>
					<CardDescription class="text-stone-400">Your latest content updates</CardDescription>
				</div>
				<Button variant="outline" href="/posts" class="border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-stone-100">
					View all
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if data.recentPosts.length === 0}
				<div class="text-center py-12">
					<FileText class="h-12 w-12 text-stone-600 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-stone-300">No posts yet</h3>
					<p class="text-stone-500 mt-1">Create your first post to get started</p>
					<Button href="/posts/new" class="mt-4 bg-amber-500 hover:bg-amber-600 text-white">
						<Plus class="mr-2 h-4 w-4" />
						Create Post
					</Button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each data.recentPosts as post}
						<a href="/posts/{post.id}" class="block p-4 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors">
							<div class="flex items-center justify-between">
								<div>
									<h4 class="font-medium text-stone-100">{post.title || 'Untitled Post'}</h4>
									<p class="text-sm text-stone-400 mt-1 line-clamp-1">{post.excerpt || 'No excerpt'}</p>
								</div>
								<div class="flex items-center gap-3">
									<span class="text-xs px-2 py-1 rounded-full {post.status === 'published' ? 'bg-green-500/10 text-green-500' : post.status === 'draft' ? 'bg-amber-500/10 text-amber-500' : 'bg-stone-500/10 text-stone-500'}">
										{post.status}
									</span>
									<span class="text-xs text-stone-500">
										{new Date(post.createdAt).toLocaleDateString()}
									</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

