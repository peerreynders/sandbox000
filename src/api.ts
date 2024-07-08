// file: src/api.ts
import { getRequestEvent, isServer } from 'solid-js/web';
import { action, cache, redirect, revalidate } from '@solidjs/router';
import { validateEmailFormat, validatePasswordFormat } from './lib/shame';
import { logout as logoutFn, signin as signinFn } from './server/api';

const NAME_ACCOUNT = 'account';
const NAME_AUTHENTICATE = 'authenticate';

// Names used to identify the form fields
const AUTHENTICATE_NAME = {
	email: 'email',
	password: 'password',
	intent: 'intent',
} as const;

// Values expected in the 'intent' form fieldcache
const AUTHENTICATE_INTENT = {
	signup: 'signup',
	login: 'login',
} as const;

export type AuthenticateIntent =
	(typeof AUTHENTICATE_INTENT)[keyof typeof AUTHENTICATE_INTENT];
export type AuthenticateName = 'email' | 'password';

export type AuthenticateResult = {
	errors: Partial<Record<AuthenticateName, string>>;
};

// Type assertion function
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
const authenticateIntents = Object.values(AUTHENTICATE_INTENT) as Array<string>;

function assertIsAuthenticateIntent(
	intent: string
): asserts intent is AuthenticateIntent {
	if (authenticateIntents.includes(intent)) return;

	throw new Error(`Unexpected authentication intent: "${intent}"`);
}

function pushError(
	errors: Array<[AuthenticateName, string]>,
	name: AuthenticateName,
	error: string | undefined
) {
	if (!error) return;
	errors.push([name, error]);
}

const authenticate = action(async (formData: FormData) => {
	'use server';
	const email = String(formData.get(AUTHENTICATE_NAME.email));
	const password = String(formData.get(AUTHENTICATE_NAME.password));
	const intent = String(formData.get(AUTHENTICATE_NAME.intent));

	assertIsAuthenticateIntent(intent);
	const errors: Array<[AuthenticateName, string]> = [];
	pushError(errors, AUTHENTICATE_NAME.email, validateEmailFormat(email));
	pushError(
		errors,
		AUTHENTICATE_NAME.password,
		validatePasswordFormat(password)
	);
	if (errors.length > 0) return { errors: Object.fromEntries(errors) };

	if (intent === 'login') {
		const loggedIn = await signinFn(email, password, false);
		if (loggedIn) throw redirect('/home', { revalidate: [NAME_ACCOUNT] });

		// Login failed
		return { errors: { [AUTHENTICATE_NAME.password]: 'Invalid credentials' } };
	}

	// Try to create account
	const registered = await signinFn(email, password, true);
	if (registered) throw redirect(`/home`, { revalidate: [NAME_ACCOUNT] });

	// Signup failed
	return {
		errors: {
			[AUTHENTICATE_NAME.email]: 'An account with this email already exists.',
		},
	};
}, NAME_AUTHENTICATE);

const getAccountUs = async () => {
	'use server';
	const event = getRequestEvent();
	if (!event) throw new Error('Unable to access account request');

	const accountId = event.locals.accountId;
	return accountId ? { accountId } : false;
};

const logoutUs = async () => {
	'use server';
	const event = getRequestEvent();
	if (!event) throw new Error('Unable to access logout request');

	logoutFn(event);
};

const noRedirect = ['/', '/signup', '/login'];

function redirectNeeded() {
	let pathname = '';
	if (isServer) {
		const event = getRequestEvent();
		if (!event) throw new Error('Unable to access request during SSR');
		pathname = event.nativeEvent.path;
	} else {
		pathname = globalThis.location.pathname;
	}
	return !noRedirect.includes(pathname);
}

const getAccount = cache(async () => {
	const account = await getAccountUs();
	if (!account && redirectNeeded()) throw redirect('/login');

	return account;
}, NAME_ACCOUNT);

const logout = async () => {
	await logoutUs();
	return revalidate(getAccount.key, true);
};

export {
	AUTHENTICATE_INTENT,
	AUTHENTICATE_NAME,
	authenticate,
	getAccount,
	logout,
};
