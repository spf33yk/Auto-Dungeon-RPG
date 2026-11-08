// Retired attacks are removed, never silently turned into unlimited waiting.
export function migrateDirectiveRows(rows){return rows.filter(r=>!(r?.cards?r.effect?.kind==='action'&&r.effect.id==='attack'&&['self','enemy','weak-enemy','danger-enemy'].includes(r.target):r?.id==='attack'||String(r?.id).startsWith('hunt-'))).map(input=>{const r=structuredClone(input);if(r?.cards&&Array.isArray(r.conditions)&&r.conditions.some(c=>c?.id==='injured')){const other=r.conditions.find(c=>c?.id==='hp-below');r.conditions=r.conditions.filter(c=>c?.id!=='injured');if(other)other.value=Math.min(other.value,50);else r.conditions.push({id:'hp-below',value:50});}return r;});}
export function migrateDirectiveCards(s){
 if(!Array.isArray(s.orders)||!Array.isArray(s.ownedCards)||!Array.isArray(s.profile?.cards)||!Array.isArray(s.items))return;
 const hadInjured=s.orders.some(r=>Array.isArray(r?.conditions)&&r.conditions.some(c=>c?.id==='injured'));
 s.orders=migrateDirectiveRows(s.orders);
 for(const [p,k]of [[s,'ownedCards'],[s.profile,'cards']]){p[k]=[...new Set(p[k].filter(id=>id!=='action:attack').map(id=>id==='condition:injured'?'condition:hp-below':id))];if(hadInjured&&!p[k].includes('condition:hp-below'))p[k].push('condition:hp-below');}
 const replace=k=>k==='action:attack'?'action:collect-herbs':k==='condition:injured'?'condition:adjacent':k;
 for(const i of s.items)if(i.cardId)i.cardId=replace(i.cardId);
 const offer=s.cardOffer;if(offer&&Array.isArray(offer.choices)){offer.choices=[...new Set(offer.choices.map(replace))];for(const k of Object.keys(offer.categories||{}))if(Array.isArray(offer.categories[k]))offer.categories[k]=[...new Set(offer.categories[k].map(replace))];}
}
