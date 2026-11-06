// Remove the retired modifier without reinterpreting it as an attack.
export function removeTacticsCard(s){
 if(!Array.isArray(s.orders)||!Array.isArray(s.ownedCards)||!Array.isArray(s.profile?.cards)||!Array.isArray(s.items))return;
 const retired=r=>(r?.effect?.id||r?.id)==='tactics';
 const owned=s.ownedCards?.includes('action:tactics');
 s.orders=s.orders.filter(r=>!retired(r));
 s.ownedCards=s.ownedCards.filter(k=>k!=='action:tactics');
 s.profile.cards=s.profile.cards.filter(k=>k!=='action:tactics');
 if(owned)s.shards+=5;
 for(const i of s.items)if(i.cardId==='action:tactics')i.cardId='action:avoid-traps';
 const replace=k=>k==='action:tactics'?'action:avoid-traps':k;
 if(s.cardOffer&&Array.isArray(s.cardOffer.choices)){s.cardOffer.choices=[...new Set(s.cardOffer.choices.map(replace))];for(const keys of Object.values(s.cardOffer.categories||{}).filter(Array.isArray))for(let i=0;i<keys.length;i++)keys[i]=replace(keys[i]);if(s.cardOffer.categories)for(const k of Object.keys(s.cardOffer.categories))if(Array.isArray(s.cardOffer.categories[k]))s.cardOffer.categories[k]=[...new Set(s.cardOffer.categories[k])];}
}
