// file: src/middleware.ts
import { createMiddleware } from '@solidjs/start/middleware';
import { getAccountId } from './server/session';

export default createMiddleware({
	onRequest: [
		(event) => {
			const result = getAccountId(event);
			if (!result) return;

			return result.then((id: string) => {
				event.locals.accountId = id;
			});
		},
	],
});
