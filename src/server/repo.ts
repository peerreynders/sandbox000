// file: src/server/repo.ts

// Return undefined if cannot login
const verifyAccount = (
	email: string,
	_password: string
): Promise<{ id: string; email: string } | undefined> =>
	Promise.resolve({ id: 'Q6jKVQNJs-lVjwNbr7Kdr', email });
//  Promise.resolve(undefined);

// Return undefined if already exists
const addAccount = (
	email: string,
	_password: string
): Promise<{ id: string; email: string } | undefined> =>
	Promise.resolve({ id: 'Q6jKVQNJs-lVjwNbr7Kdr', email });
//  Promise.resolve(undefined);

export { verifyAccount, addAccount };
