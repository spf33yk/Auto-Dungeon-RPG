export const INITIAL_CARDS=['target:self','target:enemy','action:stairs','action:attack','action:chests'];
const legendary=new Set(['condition:visible','condition:one-hit','action:tactics','action:avoid-traps','skill:warp','skill:leech','skill:double-strike']);
const epic=new Set(['target:weak-enemy','target:danger-enemy','condition:hp-below','condition:range','condition:enemy-count','condition:loot-empty','action:explore-all','action:retreat','skill:mend','skill:critical']);
export const cardKey=(kind,id)=>kind+':'+id;
export const cardRarity=(kind,id)=>legendary.has(cardKey(kind,id))?'LEGENDARY':epic.has(cardKey(kind,id))?'EPIC':'NORMAL';
export const cardOwned=(s,kind,id)=>!Array.isArray(s.ownedCards)||s.ownedCards.includes(cardKey(kind,id));
export const rewardCardKey=id=>id==='avoid-traps'?'action:avoid-traps':'skill:'+id;
