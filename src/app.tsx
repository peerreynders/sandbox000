// file: src/app.tsx
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Layout } from './layout';

import './styles/critical.scss';

export default function App() {
	return (
		<Router root={Layout}>
			<FileRoutes />
		</Router>
	);
}
