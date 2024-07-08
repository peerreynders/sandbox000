// file: src/types.ts

export type User = {
	id: string;
	email: string;
};

declare module '@solidjs/start/server' {
	interface RequestEventLocals {
		user?: User;
	}
}
