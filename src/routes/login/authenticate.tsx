// file: src/routes/login/authenticate.tsx
import { createMemo, onCleanup, onMount, Show } from 'solid-js';
import { useAction, useSubmission } from '@solidjs/router';
import { validateEmailFormat, validatePasswordFormat } from '../../lib/shame';
import {
	AUTHENTICATE_INTENT,
	AUTHENTICATE_NAME,
	authenticate,
	type AuthenticateIntent,
} from '../../api';
import { useFormValidation } from '../../components/form-validation';

const NAME = AUTHENTICATE_NAME;
const ERROR_EMAIL = 'email-error';
const ERROR_PASSWORD = 'password-error';

export type Props = {
	describedBy: string;
	submitLabel: string;
	intent: AuthenticateIntent;
};

function Authenticate(props: Props) {
	const check = useFormValidation({ errorToken: 'c-authenticate--error' });
	const submit = useAction(authenticate);
	const submission = useSubmission(authenticate);

	const emailError = createMemo(
		() =>
			(submission.result?.errors[NAME.email] || check.errors[NAME.email]) ??
			undefined
	);
	const emailDescribedBy = () =>
		emailError() ? ERROR_EMAIL : props.describedBy;
	const emailHeadingClass = () =>
		emailError() ? 'u-visually-hidden' : undefined;

	const passwordError = createMemo(
		() =>
			(submission.result?.errors[NAME.password] ||
				check.errors[NAME.password]) ??
			undefined
	);
	const passwordDescribedBy = () =>
		passwordError() ? ERROR_PASSWORD : undefined;
	const passwordHeadingClass = () =>
		passwordError() ? 'u-visually-hidden' : undefined;

	let authenticateForm: HTMLFormElement | undefined;
	let email: HTMLInputElement | undefined;
	let password: HTMLInputElement | undefined;

	onMount(() => {
		if (!authenticateForm || !email || !password)
			throw new Error('Misconfigured Form Validation');

		check.submit(authenticateForm, (form) => {
			submission.clear?.();
			submit(new FormData(form));
		});

		check.validate(email, [
			({ value }: HTMLInputElement) => validateEmailFormat(value),
		]);
		check.validate(password, [
			({ value }: HTMLInputElement) => validatePasswordFormat(value),
		]);

		onCleanup(() => check.cleanup());
	});

	return (
		<form
			action={authenticate}
			method="post"
			class="c-authenticate"
			ref={authenticateForm}
		>
			<div>
				<label for="email">
					<span class={emailHeadingClass()}>Email address </span>
					<Show when={emailError()}>
						{(message) => (
							<span id={ERROR_EMAIL} class="c-authenticate__error">
								{message()}
							</span>
						)}
					</Show>
				</label>
				<input
					id="email"
					name={NAME.email}
					type="email"
					auto-complete="email"
					aria-described-by={emailDescribedBy()}
					required
					ref={email}
				/>
			</div>
			<div>
				<label for="password">
					<span class={passwordHeadingClass()}>Password </span>
					<Show when={passwordError()}>
						{(message) => (
							<span id={ERROR_PASSWORD} class="c-authenticate__error">
								{message()}
							</span>
						)}
					</Show>
				</label>
				<input
					id="password"
					name={NAME.password}
					type="password"
					auto-complete="current-password"
					aria-described-by={passwordDescribedBy()}
					required
					ref={password}
				/>
			</div>
			<div>
				<button type="submit">{props.submitLabel}</button>
			</div>
			<input
				type="hidden"
				id="authenticate-intent"
				name={NAME.intent}
				value={props.intent}
			/>
		</form>
	);
}

export { AUTHENTICATE_INTENT, Authenticate };
