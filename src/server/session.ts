// file: src/server/session.ts
import {
	clearSession as clear,
	getSession,
	getCookie,
	deleteCookie,
	updateSession as update,
} from 'vinxi/http';

import type { RequestEvent } from 'solid-js/web';
import type { Session, SessionConfig, SessionData } from 'vinxi/http';
import type { FetchEvent } from '@solidjs/start/server';

type SessionRecord = SessionData<{ accountId: string }>;
type SessionUpdate = (r: SessionRecord) => SessionRecord;

const SESSION_NAME = '__session';

const config = (function () {
	if (
		typeof process.env.SESSION_SECRET !== 'string' ||
		process.env.SESSION_SECRET.length < 32
	)
		throw Error('SESSION_SECRET must be set and at least 32 characters long');

	// $ head -c32 /dev/urandom | base64

	const config: SessionConfig = {
		cookie: {
			// domain?: string | undefined
			// encode?: (value: string) => string
			// expires?: Date | undefined
			httpOnly: true,
			// maxAge?: number | undefined
			path: '/',
			// priority?: "low" | "medium" | "high" | undefined
			sameSite: 'lax',
			secure: true,
		},
		password: process.env.SESSION_SECRET!,
		// maxAge?: number | undefined used to set `expires` on cookie
		name: SESSION_NAME,
	};

	return config;
})();

const updateSession = (event: RequestEvent, updateFn: SessionUpdate) =>
	update(event.nativeEvent, config, updateFn);

function clearSession(event: RequestEvent) {
	// h3 `clearSession` only clears the cookie
	// data but doesn't remove the cookie itself
	return clear(event.nativeEvent, config).then(() =>
		deleteCookie(event.nativeEvent, SESSION_NAME)
	);
}

const toAccountId = (session: Session<SessionRecord>) => session.data.accountId;

function getAccountId(event: FetchEvent) {
	// Avoid creating a session if there isn't one
	// and stay synchronous …
	const sessionCookie = getCookie(event.nativeEvent, SESSION_NAME);
	if (!sessionCookie) return undefined;

	// Session exists
	// … now go async
	return getSession<SessionRecord>(event.nativeEvent, config).then(toAccountId);
}

export { getAccountId, clearSession, updateSession };
