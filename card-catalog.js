import{targetCards,conditionCards,actionCards,skillCards}from'./card-orders.js';import{cardKey,cardRarity,INITIAL_CARDS}from'./card-access.js';
const groupNames={target:'ターゲット',condition:'条件',action:'アクション',skill:'スキル'};
const active=[...targetCards,...conditionCards,...actionCards,...skillCards];
export const cardCatalog=active.map(c=>({...c,key:cardKey(c.cardKind,c.id),kind:c.cardKind,group:groupNames[c.cardKind]}));
export const cardByKey=Object.fromEntries(cardCatalog.map(c=>[c.key,c]));
export function cardCodexRows(s){return cardCatalog.map(c=>({...c,owned:s.ownedCards?.includes(c.key)??false,discovered:s.profile.cards?.includes(c.key)??false,initial:INITIAL_CARDS.includes(c.key)}));}
