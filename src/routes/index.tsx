import { Title } from '@solidjs/meta';

import '../styles/page/landing/index.scss';

export default function Landing() {
	return (
		<main class="c-landing">
			<Title>Trellis, a SolidStart Demo</Title>
			<h1>
				Solid<span>Start</span>
			</h1>
			<div class="c-landing__intro">
				<p>
					This demo explores implementing{' '}
					<a
						href="https://github.com/remix-run/example-trellix"
						target="_blank"
					>
						Trellix
					</a>{' '}
					with the capabilities found within SolidStart.
				</p>
				<p>
					It's a simple recreation of an interface featured by project
					management tools like{' '}
					<a href="https://trello.com" target="_blank">
						Trello
					</a>
					.
				</p>
				<p>Deploy it locally to take it for a spin.</p>
			</div>
			<div class="c-landing__cta">
				<a href="/signup">Sign up</a>
				<div></div>
				<a href="/login">Login</a>
			</div>
		</main>
	);
}
