// file: src/routes/login/index.tsx
import { Show } from 'solid-js';
import { createAsync, Navigate, type RouteDefinition } from '@solidjs/router';
import { Title } from '@solidjs/meta';
import { AUTHENTICATE_INTENT, Authenticate } from './authenticate';
import { getAccount } from '../../api';

import '../../styles/page/login/index.scss';

export const route = {
	load() {
		getAccount();
	},
} satisfies RouteDefinition;

const LOGIN_HEADER = 'login-header';

export default function LogIn() {
	const account = createAsync(() => getAccount(), { deferStream: true });

	return (
		<Show when={!account()} fallback={<Navigate href="/home" />}>
			<main class="c-login">
				<Title>Log In</Title>
				<div class="c-login__heading">
					<h1 id={LOGIN_HEADER}>Log in</h1>
				</div>
				<div class="c-login__authenticate">
					<div class="c-authenticate-wrapper">
						<Authenticate
							submitLabel="Log in"
							describedBy={LOGIN_HEADER}
							intent={AUTHENTICATE_INTENT.login}
						/>
						<div>
							Don't have an account? <a href="/signup">Sign up</a>.
						</div>
					</div>
				</div>
			</main>
		</Show>
	);
}
