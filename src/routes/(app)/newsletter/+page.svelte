<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { toast } from 'svelte-sonner';
	import Mail from '@lucide/svelte/icons/mail';
	import Users from '@lucide/svelte/icons/users';
	import Send from '@lucide/svelte/icons/send';
	import Clock from '@lucide/svelte/icons/clock';
	import { formatDistanceToNow } from 'date-fns';

	let { data, form } = $props();

	let sendingTest = $state(false);
	let sendingLive = $state(false);

	$effect(() => {
		if (form?.configSaved) {
			toast.success('Newsletter settings saved');
		}
		if (form?.configError) {
			toast.error(form.configError);
		}
	});

	async function sendTestNewsletter() {
		if (!data.config.testEmail) {
			toast.error('Set a test email address first');
			return;
		}
		sendingTest = true;
		try {
			const response = await fetch('/api/v1/newsletter/send?test=true', { method: 'POST' });
			const result = await response.json();
			if (response.ok && result.sent) {
				toast.success(`Test newsletter sent to ${data.config.testEmail}`);
			} else {
				toast.error(result.message || result.reason || 'Failed to send test newsletter');
			}
		} catch {
			toast.error('Failed to send test newsletter');
		} finally {
			sendingTest = false;
		}
	}

	async function sendLiveNewsletter() {
		sendingLive = true;
		try {
			const response = await fetch('/api/v1/newsletter/send', { method: 'POST' });
			const result = await response.json();
			if (response.ok && result.sent) {
				toast.success(`Newsletter sent to ${result.recipientCount} subscribers`);
				invalidateAll();
			} else {
				toast.error(result.reason || 'Failed to send newsletter');
			}
		} catch {
			toast.error('Failed to send newsletter');
		} finally {
			sendingLive = false;
		}
	}

	function statusColor(status: string) {
		switch (status) {
			case 'verified':
			case 'sent':
				return 'bg-green-500/10 text-green-500';
			case 'pending':
			case 'sending':
				return 'bg-amber-500/10 text-amber-500';
			case 'unsubscribed':
			case 'failed':
				return 'bg-stone-500/10 text-stone-500';
			default:
				return 'bg-stone-500/10 text-stone-500';
		}
	}

	function formatDate(date: string | Date | null) {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Newsletter | My CMS</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-stone-100">Newsletter</h1>
		<p class="text-stone-400 mt-1">Manage subscribers and monthly newsletter sends</p>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="bg-stone-900/50 border-stone-800">
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-amber-500/10">
						<Users class="h-4 w-4 text-amber-500" />
					</div>
					<div>
						<p class="text-2xl font-bold text-stone-100">{data.stats.verified}</p>
						<p class="text-xs text-stone-500">Active subscribers</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card class="bg-stone-900/50 border-stone-800">
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-stone-500/10">
						<Clock class="h-4 w-4 text-stone-400" />
					</div>
					<div>
						<p class="text-2xl font-bold text-stone-100">{data.stats.pending}</p>
						<p class="text-xs text-stone-500">Pending</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card class="bg-stone-900/50 border-stone-800">
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-green-500/10">
						<Send class="h-4 w-4 text-green-500" />
					</div>
					<div>
						<p class="text-2xl font-bold text-stone-100">{data.sends.length}</p>
						<p class="text-xs text-stone-500">Newsletters sent</p>
					</div>
				</div>
			</CardContent>
		</Card>
		<Card class="bg-stone-900/50 border-stone-800">
			<CardContent class="p-4">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-stone-500/10">
						<Mail class="h-4 w-4 text-stone-400" />
					</div>
					<div>
						<p class="text-2xl font-bold text-stone-100">{data.stats.total}</p>
						<p class="text-xs text-stone-500">Total signups</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Tabs -->
	<Tabs value="subscribers">
		<TabsList class="bg-stone-900 border border-stone-800">
			<TabsTrigger value="subscribers" class="data-[state=active]:bg-stone-800 data-[state=active]:text-stone-100 text-stone-400">
				Subscribers
			</TabsTrigger>
			<TabsTrigger value="settings" class="data-[state=active]:bg-stone-800 data-[state=active]:text-stone-100 text-stone-400">
				Settings
			</TabsTrigger>
			<TabsTrigger value="history" class="data-[state=active]:bg-stone-800 data-[state=active]:text-stone-100 text-stone-400">
				Send History
			</TabsTrigger>
		</TabsList>

		<!-- Subscribers Tab -->
		<TabsContent value="subscribers">
			<Card class="bg-stone-900/50 border-stone-800">
				<CardHeader>
					<CardTitle class="text-stone-100">All Subscribers</CardTitle>
					<CardDescription class="text-stone-400">
						{data.stats.verified} verified out of {data.stats.total} total signups
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.subscribers.length === 0}
						<div class="text-center py-12">
							<Users class="h-12 w-12 text-stone-600 mx-auto mb-4" />
							<h3 class="text-lg font-medium text-stone-300">No subscribers yet</h3>
							<p class="text-stone-500 mt-1">Subscribers will appear here when people sign up on your Timeline page</p>
						</div>
					{:else}
						<Table>
							<TableHeader>
								<TableRow class="border-stone-800 hover:bg-stone-800/50">
									<TableHead class="text-stone-400">Email</TableHead>
									<TableHead class="text-stone-400">Status</TableHead>
									<TableHead class="text-stone-400">Verified</TableHead>
									<TableHead class="text-stone-400">Signed Up</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each data.subscribers as subscriber}
									<TableRow class="border-stone-800 hover:bg-stone-800/50">
										<TableCell class="font-medium text-stone-100">{subscriber.email}</TableCell>
										<TableCell>
											<Badge variant="secondary" class={statusColor(subscriber.status)}>
												{subscriber.status}
											</Badge>
										</TableCell>
										<TableCell class="text-stone-400">
											{formatDate(subscriber.verifiedAt)}
										</TableCell>
										<TableCell class="text-stone-400">
											{formatDistanceToNow(new Date(subscriber.createdAt), { addSuffix: true })}
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					{/if}
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Settings Tab -->
		<TabsContent value="settings">
			<div class="space-y-6">
				<Card class="bg-stone-900/50 border-stone-800">
					<CardHeader>
						<CardTitle class="text-stone-100">Schedule Settings</CardTitle>
						<CardDescription class="text-stone-400">
							Configure when the monthly newsletter is automatically sent
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form method="POST" action="?/updateConfig" use:enhance class="space-y-5">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="sendDay" class="text-stone-300">Day of month (1-28)</Label>
									<Input
										id="sendDay"
										name="sendDay"
										type="number"
										min="1"
										max="28"
										value={data.config.sendDay}
										class="bg-stone-800 border-stone-700 text-stone-100"
									/>
								</div>
								<div class="space-y-2">
									<Label for="sendHour" class="text-stone-300">Hour (UTC, 0-23)</Label>
									<Input
										id="sendHour"
										name="sendHour"
										type="number"
										min="0"
										max="23"
										value={data.config.sendHour}
										class="bg-stone-800 border-stone-700 text-stone-100"
									/>
								</div>
							</div>

							<div class="flex items-center gap-3">
								<input
									type="checkbox"
									id="isActive"
									name="isActive"
									checked={data.config.isActive}
									class="h-4 w-4 rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-amber-500"
								/>
								<Label for="isActive" class="text-stone-300">Enable automatic monthly sending</Label>
							</div>

							<div class="space-y-2">
								<Label for="testEmail" class="text-stone-300">Test email address</Label>
								<Input
									id="testEmail"
									name="testEmail"
									type="email"
									value={data.config.testEmail || ''}
									placeholder="your@email.com"
									class="bg-stone-800 border-stone-700 text-stone-100"
								/>
								<p class="text-xs text-stone-500">Used for sending test newsletters before going live</p>
							</div>

							<Button type="submit" class="bg-amber-500 hover:bg-amber-600 text-white">
								Save Settings
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card class="bg-stone-900/50 border-stone-800">
					<CardHeader>
						<CardTitle class="text-stone-100">Manual Send</CardTitle>
						<CardDescription class="text-stone-400">
							Test or manually trigger the newsletter for the current month
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex flex-wrap gap-3">
							<Button
								onclick={sendTestNewsletter}
								disabled={sendingTest}
								variant="outline"
								class="border-stone-700 text-stone-300 hover:bg-stone-800"
							>
								<Send class="mr-2 h-4 w-4" />
								{sendingTest ? 'Sending...' : 'Send Test Newsletter'}
							</Button>
							<Button
								onclick={sendLiveNewsletter}
								disabled={sendingLive || data.stats.verified === 0}
								class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
							>
								<Mail class="mr-2 h-4 w-4" />
								{sendingLive ? 'Sending...' : `Send to ${data.stats.verified} Subscribers`}
							</Button>
						</div>
						<p class="text-xs text-stone-500">
							The test button sends to your configured test email only. The live button sends to all verified subscribers.
						</p>
					</CardContent>
				</Card>
			</div>
		</TabsContent>

		<!-- History Tab -->
		<TabsContent value="history">
			<Card class="bg-stone-900/50 border-stone-800">
				<CardHeader>
					<CardTitle class="text-stone-100">Send History</CardTitle>
					<CardDescription class="text-stone-400">
						Past newsletter sends and their status
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.sends.length === 0}
						<div class="text-center py-12">
							<Mail class="h-12 w-12 text-stone-600 mx-auto mb-4" />
							<h3 class="text-lg font-medium text-stone-300">No newsletters sent yet</h3>
							<p class="text-stone-500 mt-1">Send your first newsletter using the Settings tab</p>
						</div>
					{:else}
						<Table>
							<TableHeader>
								<TableRow class="border-stone-800 hover:bg-stone-800/50">
									<TableHead class="text-stone-400">Month</TableHead>
									<TableHead class="text-stone-400">Subject</TableHead>
									<TableHead class="text-stone-400">Recipients</TableHead>
									<TableHead class="text-stone-400">Status</TableHead>
									<TableHead class="text-stone-400">Sent</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each data.sends as send}
									<TableRow class="border-stone-800 hover:bg-stone-800/50">
										<TableCell class="font-medium text-stone-100">{send.monthYear}</TableCell>
										<TableCell class="text-stone-300 max-w-[200px] truncate">{send.subject}</TableCell>
										<TableCell class="text-stone-400">{send.recipientCount}</TableCell>
										<TableCell>
											<Badge variant="secondary" class={statusColor(send.status)}>
												{send.status}
											</Badge>
										</TableCell>
										<TableCell class="text-stone-400">
											{send.sentAt ? formatDistanceToNow(new Date(send.sentAt), { addSuffix: true }) : '—'}
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					{/if}
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
