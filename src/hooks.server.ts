import { createSupabaseServerClient } from '$lib/server/supabase';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event.cookies);

	// Get user from auth (more secure than getSession)
	const {
		data: { user },
		error
	} = await event.locals.supabase.auth.getUser();

	// Create session-like object for backwards compatibility
	if (user && !error) {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		event.locals.session = session;
	} else {
		event.locals.session = null;
	}

	// Protected routes - redirect to login if not authenticated
	const protectedPaths = ['/', '/posts', '/media', '/settings', '/newsletter'];
	const isProtectedPath = protectedPaths.some(
		(path) => event.url.pathname === path || event.url.pathname.startsWith(path + '/')
	);

	// Allow API routes with API key auth
	const isApiRoute = event.url.pathname.startsWith('/api/v1/');

	// Allow login page
	const isLoginPage = event.url.pathname === '/login';

	if (isProtectedPath && !event.locals.session && !isApiRoute && !isLoginPage) {
		throw redirect(303, '/login');
	}

	// If logged in and on login page, redirect to home
	if (isLoginPage && event.locals.session) {
		throw redirect(303, '/');
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
