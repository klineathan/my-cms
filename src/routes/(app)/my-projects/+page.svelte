<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
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
	import FolderOpen from '@lucide/svelte/icons/folder-open';

	type Project = (typeof data.projects)[0];

	let { data } = $props();

	let deleteDialogOpen = $state(false);
	let projectToDelete = $state<Project | null>(null);

	function openDelete(project: Project) {
		projectToDelete = project;
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (!projectToDelete) return;
		try {
			const res = await fetch(`/my-projects/${projectToDelete.id}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				toast.success('Project removed');
				deleteDialogOpen = false;
				projectToDelete = null;
				await invalidateAll();
			} else {
				toast.error('Failed to delete project');
			}
		} catch {
			toast.error('Failed to delete project');
		}
	}
</script>

<svelte:head>
	<title>My Projects | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-stone-100">My Projects</h1>
			<p class="text-stone-400 mt-1">Projects shown in the "Artifacts" section on your site</p>
		</div>
		<Button
			href="/my-projects/new"
			class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
		>
			<Plus class="mr-2 h-4 w-4" />
			New Project
		</Button>
	</div>

	{#if data.projects.length === 0}
		<div class="text-center py-16 bg-stone-900/50 rounded-lg border border-stone-800">
			<FolderOpen class="h-12 w-12 text-stone-600 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-stone-300">No projects yet</h3>
			<p class="text-stone-500 mt-1">Create your first project to display in the "Artifacts" section.</p>
			<Button
				href="/my-projects/new"
				class="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
			>
				<Plus class="mr-2 h-4 w-4" />
				New Project
			</Button>
		</div>
	{:else}
		<div class="rounded-lg border border-stone-800 overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow class="border-stone-800 hover:bg-stone-800/50">
						<TableHead class="text-stone-400 w-[80px]">Thumb</TableHead>
						<TableHead class="text-stone-400">Title</TableHead>
						<TableHead class="text-stone-400 w-[80px]">Order</TableHead>
						<TableHead class="text-stone-400 w-[80px]">Visible</TableHead>
						<TableHead class="text-stone-400 w-[100px]"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each data.projects as project}
						<TableRow class="border-stone-800 hover:bg-stone-800/50">
							<TableCell>
								<img
									src={project.mediaUrl}
									alt={project.mediaAltText ?? ''}
									class="w-12 h-12 rounded object-cover border border-stone-700"
								/>
							</TableCell>
							<TableCell>
								<a href="/my-projects/{project.id}/edit" class="text-stone-200 font-medium hover:text-amber-500 transition-colors">
									{project.title}
								</a>
							</TableCell>
							<TableCell class="text-stone-400">{project.order}</TableCell>
							<TableCell class="text-stone-400">{project.isVisible ? 'Yes' : 'No'}</TableCell>
							<TableCell>
								<div class="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										href="/my-projects/{project.id}/edit"
										class="text-stone-400 hover:text-stone-100"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-red-400 hover:text-red-300 hover:bg-red-900/30"
										onclick={() => openDelete(project)}
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

<AlertDialog bind:open={deleteDialogOpen}>
	<AlertDialogContent class="bg-stone-900 border-stone-800">
		<AlertDialogHeader>
			<AlertDialogTitle class="text-stone-100">Remove project</AlertDialogTitle>
			<AlertDialogDescription class="text-stone-400">
				This will permanently remove this project. This cannot be undone.
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
