export function migrateLootEmptyRow(input){
 const r=structuredClone(input);
 if(r?.id==='stairs-after-loot'&&!r.cards)return {id:'cards',cards:true,target:'self',conditions:[],effect:{kind:'action',id:'stairs'},disabled:true};
 if(r?.cards&&Array.isArray(r.conditions)&&r.conditions.some(c=>c?.id==='loot-empty')){r.conditions=r.conditions.filter(c=>c?.id!=='loot-empty');r.disabled=true;}
 return r;
}
export function migrateLootCondition(s){
 if(!Array.isArray(s.orders)||!Array.isArray(s.ownedCards)||!Array.isArray(s.profile?.cards)||!Array.isArray(s.items))return;
 if(s.ownedCards.includes('condition:loot-empty'))s.shards+=5;
 s.ownedCards=s.ownedCards.filter(k=>k!=='condition:loot-empty');
 s.profile.cards=s.profile.cards.filter(k=>k!=='condition:loot-empty');
 for(const list of [s.ownedCards,s.profile.cards])if(!list.includes('condition:turns'))list.push('condition:turns');
 s.orders=s.orders.map(migrateLootEmptyRow);
 const replace=k=>k==='condition:loot-empty'?'condition:range':k==='condition:turns'?'condition:hp-above':k;
 for(const i of s.items)if(i.cardId)i.cardId=replace(i.cardId);
 const offer=s.cardOffer;if(offer&&Array.isArray(offer.choices)){offer.choices=[...new Set(offer.choices.map(replace))];for(const k of Object.keys(offer.categories||{}))if(Array.isArray(offer.categories[k]))offer.categories[k]=[...new Set(offer.categories[k].map(replace))];}
}
