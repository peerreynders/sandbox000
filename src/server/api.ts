// file: src/server/api.ts
import { getRequestEvent } from 'solid-js/web';
import { clearSession, updateSession } from './session';
import { verifyAccount, addAccount } from './repo';

import type { RequestEvent } from 'solid-js/web';

function logout(event: RequestEvent) {
	const { user: _user, ...rest } = event.locals;
	event.locals = rest;
	return clearSession(event);
}

async function signin(email: string, password: string, newAccount = false) {
	const account = await (newAccount ? addAccount : verifyAccount)(
		email,
		password
	);
	if (!account) return false;

	const event = getRequestEvent();
	if (!event) throw Error('Unable to access signup/login request');

	// Need await update otherwise response headers can't be set
	await updateSession(event, (_data) => ({ accountId: account.id }));
	return true;
}

export { logout, signin };
