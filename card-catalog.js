import{targetCards,conditionCards,actionCards,skillCards}from'./card-orders.js';import{rewardDefinitions}from'./data.js';import{cardKey,cardRarity,INITIAL_CARDS}from'./card-access.js';
const groupNames={target:'ターゲット',condition:'条件',action:'アクション',skill:'スキル'};
const active=[...targetCards,...conditionCards,...actionCards,...skillCards];
export const cardCatalog=[...active.map(c=>({...c,key:cardKey(c.cardKind,c.id),kind:c.cardKind,group:groupNames[c.cardKind]})),...rewardDefinitions.filter(r=>['critical','leech','double-strike'].includes(r.id)).map(r=>({...r,key:'skill:'+r.id,kind:'skill',group:'スキル（常時効果）',rarity:cardRarity('skill',r.id),passive:true,detail:r.detail+' 取得すると自動発動し、指示行への配置は不要。'}))];
export const cardByKey=Object.fromEntries(cardCatalog.map(c=>[c.key,c]));
export function cardCodexRows(s){return cardCatalog.map(c=>({...c,owned:s.ownedCards?.includes(c.key)??false,discovered:s.profile.cards?.includes(c.key)??false,initial:INITIAL_CARDS.includes(c.key)}));}
