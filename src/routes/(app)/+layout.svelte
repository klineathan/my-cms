<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getSupabaseClient } from '$lib/supabase';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import FileText from '@lucide/svelte/icons/file-text';
	import Image from '@lucide/svelte/icons/image';
	import Settings from '@lucide/svelte/icons/settings';
	import Key from '@lucide/svelte/icons/key';
	import LogOut from '@lucide/svelte/icons/log-out';
	import User from '@lucide/svelte/icons/user';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Mail from '@lucide/svelte/icons/mail';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import CircleUser from '@lucide/svelte/icons/circle-user';

	let { children, data } = $props();

	let mobileMenuOpen = $state(false);
	let selectedContentType = $state('posts');

	const contentTypes = [
		{ value: 'posts', label: 'Posts', icon: FileText },
		{ value: 'homepage-profiles', label: 'Homepage Profiles', icon: CircleUser }
	];

	$effect(() => {
		const path = $page.url.pathname;
		if (path.startsWith('/homepage-profiles')) selectedContentType = 'homepage-profiles';
		else if (path.startsWith('/posts') || path === '/') selectedContentType = 'posts';
	});

	const navigation = $derived([
		{ name: 'Dashboard', href: '/', icon: LayoutDashboard },
		{
			name: contentTypes.find((t) => t.value === selectedContentType)?.label || 'Posts',
			href: `/${selectedContentType}`,
			icon: contentTypes.find((t) => t.value === selectedContentType)?.icon || FileText
		},
		{ name: 'Media Library', href: '/media', icon: Image },
		{ name: 'Newsletter', href: '/newsletter', icon: Mail },
		{ name: 'API Keys', href: '/settings/api-keys', icon: Key },
		{ name: 'Settings', href: '/settings', icon: Settings }
	]);

	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}

	async function handleLogout() {
		const supabase = getSupabaseClient();
		await supabase.auth.signOut();
		goto('/login');
	}

	function handleContentTypeChange(value: string | undefined) {
		if (value) {
			selectedContentType = value;
			goto(`/${value}`);
		}
	}
</script>

<div class="flex h-screen bg-stone-950">
	<!-- Sidebar -->
	<aside
		class="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-stone-800 bg-stone-900/50"
	>
		<div class="flex flex-col flex-1 min-h-0">
			<!-- Logo -->
			<div class="flex items-center h-16 flex-shrink-0 px-4 border-b border-stone-800">
				<div
					class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-3"
				>
					<span class="text-sm font-bold text-white">T</span>
				</div>
				<span class="text-lg font-semibold text-stone-100">My CMS</span>
			</div>

			<!-- Content Type Selector -->
			<div class="px-3 py-4">
				<Select type="single" value={selectedContentType} onValueChange={handleContentTypeChange}>
					<SelectTrigger class="w-full bg-stone-800/50 border-stone-700 text-stone-100">
						<SelectValue placeholder="Select content type">
							{contentTypes.find((t) => t.value === selectedContentType)?.label || 'Select content type'}
						</SelectValue>
					</SelectTrigger>
					<SelectContent class="bg-stone-800 border-stone-700">
						{#each contentTypes as type}
							<SelectItem value={type.value} class="text-stone-100 focus:bg-stone-700">
								<div class="flex items-center gap-2">
									<type.icon class="h-4 w-4" />
									{type.label}
								</div>
							</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			<Separator class="bg-stone-800" />

			<!-- Navigation -->
			<ScrollArea class="flex-1 px-3 py-4">
				<nav class="space-y-1">
					{#each navigation as item}
						<a
							href={item.href}
							class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors {isActive(
								item.href
							)
								? 'bg-amber-500/10 text-amber-500'
								: 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'}"
						>
							<item.icon
								class="mr-3 h-5 w-5 flex-shrink-0 {isActive(item.href)
									? 'text-amber-500'
									: 'text-stone-500 group-hover:text-stone-400'}"
							/>
							{item.name}
						</a>
					{/each}
				</nav>
			</ScrollArea>

			<!-- User Menu -->
			<div class="flex-shrink-0 border-t border-stone-800 p-3">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button
							variant="ghost"
							class="w-full justify-start text-stone-300 hover:text-stone-100 hover:bg-stone-800"
						>
							<div
								class="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center mr-3"
							>
								<User class="h-4 w-4 text-stone-400" />
							</div>
							<span class="truncate">{data.session?.user?.email || 'User'}</span>
							<ChevronDown class="ml-auto h-4 w-4 text-stone-500" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent class="w-56 bg-stone-800 border-stone-700" align="end">
						<DropdownMenuLabel class="text-stone-300">My Account</DropdownMenuLabel>
						<DropdownMenuSeparator class="bg-stone-700" />
						<DropdownMenuItem
							class="text-stone-300 focus:bg-stone-700 focus:text-stone-100 cursor-pointer"
							onclick={handleLogout}
						>
							<LogOut class="mr-2 h-4 w-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	</aside>

	<!-- Mobile header -->
	<div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-stone-900 border-b border-stone-800">
		<div class="flex items-center justify-between h-16 px-4">
			<div class="flex items-center">
				<div
					class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-3"
				>
					<span class="text-sm font-bold text-white">T</span>
				</div>
				<span class="text-lg font-semibold text-stone-100">My CMS</span>
			</div>
			<Button
				variant="ghost"
				size="icon"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="text-stone-400"
			>
				{#if mobileMenuOpen}
					<X class="h-6 w-6" />
				{:else}
					<Menu class="h-6 w-6" />
				{/if}
			</Button>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="lg:hidden fixed inset-0 z-30 bg-stone-950/80 backdrop-blur-sm" role="dialog">
			<div class="fixed inset-y-0 left-0 w-64 bg-stone-900 border-r border-stone-800 pt-16">
				<ScrollArea class="h-full px-3 py-4">
					<nav class="space-y-1">
						{#each navigation as item}
							<a
								href={item.href}
								onclick={() => (mobileMenuOpen = false)}
								class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors {isActive(
									item.href
								)
									? 'bg-amber-500/10 text-amber-500'
									: 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'}"
							>
								<item.icon class="mr-3 h-5 w-5 flex-shrink-0" />
								{item.name}
							</a>
						{/each}
					</nav>
					<Separator class="my-4 bg-stone-800" />
					<Button
						variant="ghost"
						class="w-full justify-start text-stone-400 hover:text-stone-100"
						onclick={handleLogout}
					>
						<LogOut class="mr-3 h-5 w-5" />
						Sign out
					</Button>
				</ScrollArea>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<main class="lg:pl-64 flex flex-col flex-1 min-h-0">
		<div class="flex-1 pt-16 lg:pt-0">
			{@render children()}
		</div>
	</main>
</div>
