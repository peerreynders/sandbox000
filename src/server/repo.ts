// file: src/server/repo.ts
import { createStorage } from 'unstorage';
import {
	concatMap,
	forkJoin,
	from,
	of,
	map,
	mergeMap,
	Observable,
	rx,
	switchMap,
} from 'rxjs';
import { nanoid } from 'nanoid';
import fsLiteDriver from 'unstorage/drivers/fs-lite';
import bcrypt from 'bcryptjs';

type AccountRecord = {
	id: string;
	email: string;
};

type AuthnRecord = {
	id: string; // to account
	hash: string;
};

type BoardRecord = {
	id: string;
	createdAt: number;
	updatedAt: number;
	name: string;
	color: string;
};

type ListRecord = {
	id: string;
	createdAt: number;
	updatedAt: number;
	rank: string;
	boardId: string;
	name: string;
};

type CardRecord = {
	id: string;
	createdAt: number;
	updatedAt: number;
	rank: string;
	listId: string;
	title: string;
	content?: string;
};

const storage = createStorage({
	driver: fsLiteDriver({
		base: '.data',
	}),
});

// Accounts store
const toAccounts = (accounts: Array<AccountRecord>) =>
	from(storage.setItem<Array<AccountRecord>>('account$', accounts));

function initAccounts() {
	const accounts: Array<AccountRecord> = [];
	console.log('initializing accounts');
	return rx(
		toAccounts(accounts),
		map(() => accounts)
	);
}

const fromAccounts = () =>
	rx(
		storage.getItem<Array<AccountRecord>>('account$'),
		switchMap((accounts) => (accounts ? of(accounts) : initAccounts()))
	);

// Authentication store
const toAuthns = (authns: Array<AuthnRecord>) =>
	from(storage.setItem<Array<AuthnRecord>>('authn$', authns));

function initAuthns() {
	const authns: Array<AuthnRecord> = [];
	console.log('initializing authentications');
	return rx(
		toAuthns(authns),
		map((_dontCare) => authns)
	);
}

const fromAuthns = () =>
	rx(
		storage.getItem<Array<AuthnRecord>>('authn$'),
		switchMap((authns) => (authns ? of(authns) : initAuthns()))
	);

// BoardsLists
const boardsKey = (accountId: string) => `${accountId}:boards`;
const toBoards = (accountId: string, boards: Array<BoardRecord>) =>
	from(storage.setItem<Array<BoardRecord>>(boardsKey(accountId), boards));
const fromBoards = (accountId: string) => 
	rx(
		storage.getItem<Array<BoardRecord>>(boardsKey(accountId)),
		map((boards) => {
			if (boards) return boards
			throw new Error(`Attempt to read uninitalized boards for ${accountId}`);
		}),
	);

// Lists
const listsKey = (accountId: string) => `${accountId}:lists`;
const toLists = (accountId: string, lists: Array<ListRecord>) =>
	from(storage.setItem<Array<ListRecord>>(listsKey(accountId), lists));

// Cards
const cardsKey = (accountId: string) => `${accountId}:cards`;
const toCards = (accountId: string, cards: Array<CardRecord>) =>
	from(storage.setItem<Array<CardRecord>>(cardsKey(accountId), cards));

type HashCallback = (error: Error | null, hash: string) => void;
type SaltCallback = (error: Error | null, salt: string) => void;

function hashPassword(password: string) {
	return new Observable<string>((destination) => {
		const hashCb: HashCallback = (error, hash) => {
			if (error) {
				destination.error(error);
				return;
			}
			destination.next(hash);
			destination.complete();
		};
		const saltCb: SaltCallback = (error, salt) => {
			if (error) {
				destination.error(error);
				return;
			}

			bcrypt.hash(password, salt, hashCb);
		};

		bcrypt.genSalt(10, saltCb);
	});
}

function matchPassword(account: AccountRecord, hash:string, password:string) {
	return new Observable<AccountRecord | undefined>((destination) => {
		bcrypt.compare(password, hash, (error, matched) => {
			if (error) {
				destination.error(error);
				return;
			}
			destination.next(matched ? account : undefined);
			destination.complete();
		});
	});	
}

// Add account flow
//	1. read accounts 
//	2a. return `undefined` if email is already in use (complete)
//	2b. Add new account to accounts and concurrently:
// 		- generate password hash
// 		- read authns
// 		- pass new account and updated account as `context`
//	3. Based on generated hash add new record to authns
//		yielding new account record, updated accounts 
//		and updated authns.
//	4. Concurrently:
//		- pass new account record
//		- write updated accounts
//		- write updated authns
//		- write empty boards
//		- write empty lists
//		- write empty cards
//	complete

function flowAddToAccounts(
	email: string, 
	password: string, 
	accounts: Array<AccountRecord>
) {
	const account = { id: nanoid(), email };
	accounts.push(account);

	return forkJoin({
		hash: hashPassword(password),
		authns: fromAuthns(),
		context: of({ accounts, account }),
	}).pipe(
		map(({ hash, authns, context }) => {
			authns.push({ id: context.account.id, hash });

			return {
				account: context.account,
				accounts: context.accounts,
				authns,
			};
		}),
		mergeMap(({ account, accounts, authns }) => {
			return forkJoin({
				account: of(account),
				accounts: toAccounts(accounts),
				authns: toAuthns(authns),
				boards: toBoards(account.id, []),
				lists: toLists(account.id, []),
				cards: toCards(account.id, []),
			});
		}),
		map(({account}) => account),
	);
}

function flowAddAccount(email: string, password: string) {
	const hasEmail = (record: AccountRecord) => record.email === email;

	return fromAccounts().pipe(
		switchMap((accounts) => accounts.some(hasEmail) ? of(undefined) : flowAddToAccounts(email, password, accounts))
	);
}

type TaskCore<T> = {
	resolve: (result: T) => void;
	reject: (error: Error) => void;
}

type AddAccountTask = {
	kind: 0;
	email: AccountRecord['email'];
	password: string;
} & TaskCore<AccountRecord | undefined>;

// Verify Account flow
//	1. read accounts 
//	2. find account record with matching email
//	3a. `undefined` if matching record cannot be found (complete)
//	3b. read authns
//  4. find authn record with matching account id
//  5. `undefined` if matching record cannot be found (complete)
//  6a. `undefined` if password doesn't match authn's hash (complete)
//  6b. Matching, authenticated account record (complete)
// 
function flowVerifyAccountAuthn(account: AccountRecord, password: string) {
	const findAuthnByAccountId = (records: Array<AuthnRecord>) => records.find((authn) => authn.id === account.id);
	return fromAuthns().pipe(
		map(findAuthnByAccountId),
		switchMap((authn) => authn ? matchPassword(account, authn.hash, password) : of(undefined))
	);
}

function flowVerifyAccount(email: string, password: string) {
	const findAccountByEmail = (records: Array<AccountRecord>) => records.find((account) => account.email === email);

	return fromAccounts().pipe(
		map(findAccountByEmail),
		switchMap((account) => account ? flowVerifyAccountAuthn(account, password) : of(undefined))
	);
}

type VerifyAccountTask = {
	kind: 1;
	email: AccountRecord['email'];
	password: string;
} & TaskCore<AccountRecord | undefined>;

// Add Board flow
function flowAddBoard(accountId: AccountRecord['id'], name: BoardRecord['name'], color: BoardRecord['color']) {
	const updatedAt = Date.now();
	const board: BoardRecord = { id: nanoid(), createdAt: updatedAt, updatedAt, name, color };

	return fromBoards(accountId).pipe(
		map((boards) => {
			boards.push(board);
			return toBoards(accountId, boards);
		}),
		map(() => board)
	);
}

type AddBoardTask = {
	kind: 2;
	accountId: AccountRecord['id'];
	name: BoardRecord['name'];
	color: BoardRecord['color'];
	resolve: (board: BoardRecord) => void;
	reject: (error: Error) => void;
} & TaskCore<BoardRecord>;

// Update Board flow
function flowUpdateBoard(
	accountId: AccountRecord['id'], 
	id: BoardRecord['id'], 
	updatedAt: BoardRecord['updatedAt'],
	name: BoardRecord['name'], 
	color: BoardRecord['color']
) {
	return fromBoards(accountId).pipe(
		concatMap((boards) => {
			const board = boards.find((item) => item.id === id);
			if (!board) return of(undefined);
			if (board.updatedAt !== updatedAt) return of(false as const);
			board.name = name;
			board.color = color;
			board.updatedAt = Date.now();
			return toBoards(accountId, boards).pipe(() => of(board)); 
		})
	);
}

type UpdateBoardTask = {
	kind: 3;
	accountId: AccountRecord['id'];
	id: BoardRecord['id'];
	updatedAt: BoardRecord['updatedAt'];
	name: BoardRecord['name'];
	color: BoardRecord['color'];
} & TaskCore<BoardRecord | false | undefined>;

// Remove Board flow
function flowPurgeBoards(accountId: AccountRecord['id'], ids: Array<BoardRecord['id']>) {
	return fromBoards(accountId).pipe(
		concatMap((boards) => {	
			const purged = boards.filter((item) => !ids.includes(item.id));
			const removed = boards.length - purged.length
			return removed > 0 ? toBoards(accountId, purged).pipe(map(() => removed)) : of(0);
		})
	);
}

type PurgeBoardsTask = {
	kind: 4;
	accountId: AccountRecord['id'];
	ids: Array<BoardRecord['id']>;
} & TaskCore<number>;

// Tasks
type Task = AddAccountTask | VerifyAccountTask | AddBoardTask | UpdateBoardTask | PurgeBoardsTask;

const makeTaskObserver = <T, U extends TaskCore<T>>(task: U, done: () => void) => ({
	next(result: T) {
		task.resolve(result);
	},
	complete: done,
	error(error: Error) {
		task.reject(error);
		done();
	},
});

let scheduled = false;
let currentIndex = -1;
const tasks: Array<Task> = [];

function runTasks() {
	currentIndex += 1;

	if (currentIndex >= tasks.length) {
		// No more tasks
		tasks.length = 0;
		currentIndex = -1;
		scheduled = false;
		return;
	}

	const task = tasks[currentIndex];
	switch (task.kind) {
		case 0: {
			flowAddAccount(task.email, task.password).subscribe(makeTaskObserver(task, runTasks));
			return;
		}
		case 1: {
			flowVerifyAccount(task.email, task.password).subscribe(makeTaskObserver(task, runTasks));
			return;
		}
		case 2: {
			flowAddBoard(task.accountId, task.name, task.color).subscribe(makeTaskObserver(task, runTasks));
			return;
		}
		case 3: {
			flowUpdateBoard(
				task.accountId, 
				task.id, 
				task.updatedAt, 
				task.name, 
				task.color
			).subscribe(makeTaskObserver(task, runTasks));
			return;
		}
		case 4: {
			flowPurgeBoards(task.accountId, task.ids).subscribe(makeTaskObserver(task, runTasks));
			return;
		}
	}
}

function queueTask(task: Task) {
	tasks.push(task);
	if (scheduled) return;

	scheduled = true;
	queueMicrotask(runTasks);
}

// resolves to added account record or undefined if email is already in use.
const addAccount = (email: AccountRecord['email'], password: string) =>
	new Promise<AccountRecord | undefined>((resolve, reject) => {
		queueTask({ kind: 0, email, password, resolve, reject });
	});

// resolves to verified account record 
// or undefined when there is no account or password doesn't match
const verifyAccount = (email: AccountRecord['email'], password: string) =>
	new Promise<AccountRecord | undefined>((resolve, reject) => {
		queueTask({ kind: 1, email, password, resolve, reject });
	});

const addBoard = (accountId: AccountRecord['id'], name: BoardRecord['name'], color: BoardRecord['color']) =>
	new Promise<BoardRecord>((resolve, reject) => {
		queueTask({ kind: 2, accountId, name, color, resolve, reject });
	});

const updateBoard = (
	accountId: AccountRecord['id'], 
	id: BoardRecord['id'], 
	updatedAt: BoardRecord['updatedAt'], 
	name: BoardRecord['name'], 
	color: BoardRecord['color']
) =>
	new Promise<BoardRecord | false | undefined>((resolve, reject) => {
		queueTask({ kind: 3, accountId, id, updatedAt, name, color, resolve, reject });
	});

const purgeBoards = (accountId: AccountRecord['id'], ids: Array<BoardRecord['id']>) =>
	new Promise<number>((resolve, reject) => {
		queueTask({ kind: 4, accountId, ids, resolve, reject });
	});

// --- experimental ---
/*
function exec() {
	const email = 'kody@gmail.com';
	const password = 'twixroxz';

	const o = flowVerifyAccount(email, password);

	o.subscribe({
		error(e) {
			console.log(e);
		},
		next(v) {
			console.log(JSON.stringify(v));
		},
		complete() {
			console.log('done!');
		},
	});
}
*/
function exec() {
	const o = flowAddBoard('Q6jKVQNJs-lVjwNbr7Kdr','jane','red');

	o.subscribe({
		error(e) {
			console.log('error callback',e);
		},
		next(v) {
			console.log(JSON.stringify(v));
		},
		complete() {
			console.log('done!');
		},
	});
}

export { addAccount, addBoard, updateBoard, purgeBoards, verifyAccount, exec };
