// Save-compatible type heart is displayed as 回復ポーション. potion/herb remain aliases.
export const isHealingItem=i=>['heart','herb','potion'].includes(i?.type);
export const healingCardKey=k=>k==='action:collect-springs'?'action:collect-herbs':k;
export function healingRow(input){const r=structuredClone(input);if(r?.effect?.kind==='action'&&r.effect.id==='collect-springs')r.effect.id='collect-herbs';return r;}
export function migrateHealingItems(s){
 for(const i of s.items||[]){if(isHealingItem(i))i.type='heart';if(i.cardId)i.cardId=healingCardKey(i.cardId);}
 for(const [o,k]of [[s,'ownedCards'],[s,'newCards'],[s.profile,'cards']])if(Array.isArray(o?.[k]))o[k]=[...new Set(o[k].map(healingCardKey))];
 if(Array.isArray(s.orders))s.orders=s.orders.map(healingRow);
 if(Array.isArray(s.cardOffer?.choices))s.cardOffer.choices=[...new Set(s.cardOffer.choices.map(healingCardKey))];
 for(const [k,v]of Object.entries(s.cardOffer?.categories||{}))if(Array.isArray(v))s.cardOffer.categories[k]=[...new Set(v.map(healingCardKey))];
}
