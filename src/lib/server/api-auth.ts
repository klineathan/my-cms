import { db } from '$lib/server/db';
import { apiKeys } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function validateApiKey(request: Request): Promise<boolean> {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader?.startsWith('Bearer ')) {
		return false;
	}

	const apiKey = authHeader.slice(7);
	if (!apiKey) {
		return false;
	}

	const keyPrefix = apiKey.slice(0, 8);

	const [keyRecord] = await db
		.select()
		.from(apiKeys)
		.where(and(eq(apiKeys.keyPrefix, keyPrefix), eq(apiKeys.isActive, true)));

	if (!keyRecord) {
		return false;
	}

	if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
		return false;
	}

	const encoder = new TextEncoder();
	const data = encoder.encode(apiKey);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

	if (hashHex !== keyRecord.keyHash) {
		return false;
	}

	await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRecord.id));

	return true;
}
