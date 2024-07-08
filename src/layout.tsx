// file: src/layout.tsx
import { Show, Suspense } from 'solid-js';
import { createAsync } from '@solidjs/router';
import { MetaProvider, Title } from '@solidjs/meta';
import { getAccount, logout } from './api';
import { LoginIcon, LogoutIcon } from './components/icon';

import type { ParentProps } from 'solid-js';

const IconLink = (props: { icon: string; href: string; label: string }) => (
	<a href={props.href} class="c-icon-link">
		<img src={props.icon} aria-hidden />
		<span>{props.label}</span>
	</a>
);

function SessionControl() {
	const account = createAsync(() => getAccount(), { deferStream: true });
	const isLoggedIn = () => Boolean(account());

	return (
		<Show
			when={isLoggedIn()}
			fallback={
				<a href="/login">
					<LoginIcon />
					<span>Log in</span>
				</a>
			}
		>
			<button onClick={(_e) => logout()}>
				<LogoutIcon />
				<span>Log out</span>
			</button>
		</Show>
	);
}

function Layout(props: ParentProps) {
	return (
		<MetaProvider>
			<Title>SolidStart - Basic</Title>
			<Suspense>
				<div class="c-header">
					<a class="c-header__home" href="/home">
						<div>Trellis</div>
						<div>a SolidStart Demo</div>
					</a>
					<div class="c-header__link">
						<IconLink
							href="https://www.youtube.com/@solid_js"
							label="Videos"
							icon="/yt_icon_mono_dark.png"
						/>
						<IconLink
							href="https://github.com/peerreynders/sandbox000"
							label="Source"
							icon="/github-mark-white.png"
						/>
						<IconLink
							href="https://docs.solidjs.com"
							label="Docs"
							icon="/logo-dark.png"
						/>
					</div>
					<div class="c-header__session">
						<SessionControl />
					</div>
				</div>
				{props.children}
			</Suspense>
		</MetaProvider>
	);
}

export { Layout };
