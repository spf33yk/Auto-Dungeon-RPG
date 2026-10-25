import {enemyDropTables,chestRewards,rewardById} from './data.js';
// Random progress belongs to the save, so reloading cannot reroll the next action.
export function nextRandom(s){s.rngState=(s.rngState+0x6D2B79F5)>>>0;let t=Math.imul(s.rngState^s.rngState>>>15,1|s.rngState);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;}
export function weightedPick(entries,rng){const total=entries.reduce((n,e)=>n+e.weight,0);if(!(total>0))return null;let n=rng()*total;for(const e of entries){n-=e.weight;if(n<0)return e;}return entries.at(-1);}
export function rollEnemyDrop(enemyId,rng,tables=enemyDropTables){const table=tables[enemyId];if(!table||rng()>=table.rate)return null;const entry=weightedPick(table.entries,rng);return entry?{type:entry.type,...(entry.id?{id:entry.id}:{})}:null;}
export const rollChestReward=rng=>weightedPick(chestRewards,rng).id;
export function grantReward(s,id){const reward=rewardById[id];if(!reward)return false;const list=reward.kind==='skill'?s.abilities:s.unlockedOrders;const fresh=!list.includes(id);if(fresh)list.push(id);else s.shards+=5;if(!s.profile.skills.includes(id))s.profile.skills.push(id);return fresh;}
