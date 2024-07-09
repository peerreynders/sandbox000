import { /*exec, addAccount, verifyAccount, addBoard */ updateBoard } from './src/server/repo';

updateBoard('Q6jKVQNJs-lVjwNbr7Kdr','ls9QH0i0FUuo7G_PcYNjQ', 1715476956077,'kilroy','yellow').then((v) => {
	console.log('then:', v);
}).catch((e) =>{
	console.log('catch:', e);
});

// exec();
/*
purgeBoards('Q6jKVQNJs-lVjwNbr7Kdr', ['enCEr223k1HMsz_40ZYLs']).then((v) => {
	console.log('then:', v);
}).catch((e) =>{
	console.log('catch:', e);
});

addBoard('Q6jKVQNJs-lVjwNbr7Kdr','jill','green').then((v) => {
	console.log('then:', v);
}).catch((e) =>{
	console.log('catch:', e);
});

verifyAccount('kody@gmail.com','twixroxz').then((v) => {
	console.log('then:', v);
}).catch((e) =>{
	console.log('catch:', e);
});

addAccount('kody@gmail.com','twixroxz').then((v) => {
	console.log('then:', v);
}).catch((e) =>{
	console.log('catch:', e);
});

let idTime = 0;
let idValue = 0;
function makeCorrelationId() {
  const base = performance.now(); 
  if (base > idTime) {
    idTime = base;
    const value = Math.trunc(idTime * 1000);
    idValue = value > idValue ? value : idValue + 1;
  } else
    ++idValue; 

  return idValue.toString(36).padStart(11,'0');
}
*/
