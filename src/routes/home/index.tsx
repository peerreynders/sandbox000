// file: src/routes/home/index.tsx
import { createEffect, Show } from 'solid-js';
import { createAsync, type RouteDefinition } from '@solidjs/router';
import { Title } from '@solidjs/meta';
import { getAccount } from '../../api';

export const route = {
	load() {
		getAccount();
	},
} satisfies RouteDefinition;

export default function Home() {
	const account = createAsync(() => getAccount(), { deferStream: true });
	createEffect(() => console.log('Home', account()));
	return (
		<main>
			<Title>Home</Title>
			<h1>Home</h1>
			<Show when={account()}>{(a) => <p>{a().accountId}</p>}</Show>
		</main>
	);
}
