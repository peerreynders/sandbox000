// file: src/components/icon/index.tsx
// https://vitejs.dev/guide/assets#explicit-url-imports
import iconsHref from './icons.svg?url';

const LoginIcon = () => (
	<svg class="c-login-icon">
		<use href={`${iconsHref}#login`} />
	</svg>
);

const LogoutIcon = () => (
	<svg class="c-logout-icon">
		<use href={`${iconsHref}#logout`} />
	</svg>
);

export { LoginIcon, LogoutIcon };
