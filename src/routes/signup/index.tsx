// file: src/routes/signup/index.tsx
import { Show } from 'solid-js';
import { createAsync, Navigate, type RouteDefinition } from '@solidjs/router';
import { Title } from '@solidjs/meta';
import { AUTHENTICATE_INTENT, Authenticate } from '../login/authenticate';
import { getAccount } from '../../api';

import '../../styles/page/signup/index.scss';

export const route = {
	load() {
		getAccount();
	},
} satisfies RouteDefinition;

const SIGNUP_HEADER = 'signup-header';

export default function SignUp() {
	const account = createAsync(() => getAccount(), { deferStream: true });

	return (
		<Show when={!account()} fallback={<Navigate href="/home" />}>
			<main class="c-signup">
				<Title>Sign Up</Title>
				<div class="c-signup__heading">
					<h1 id={SIGNUP_HEADER}>Sign up</h1>
				</div>
				<div class="c-signup__authenticate">
					<div class="c-authenticate-wrapper">
						<Authenticate
							submitLabel="Sign up"
							describedBy={SIGNUP_HEADER}
							intent={AUTHENTICATE_INTENT.signup}
						/>
						<div>
							Already have an account? <a href="/login">Log in</a>.
						</div>
					</div>
					<div class="c-signup__conditions">
						<h2>Privacy Notice</h2>
						<p>
							The data is as private as your local file system. Consider
							yourself warned.
						</p>
						<h2>Terms of Service</h2>
						<p>
							This is a demo app, there are no terms of service. Any data will
							be saved to your local file system. It's your responsibility to
							take care of that.
						</p>
					</div>
				</div>
			</main>
		</Show>
	);
}
