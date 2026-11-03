import{legacyToCards}from'./card-orders.js';
// 一括回収カードは公開カタログから削除。旧セーブは行を増やさず個別指示へ変換する。
export const retiredCollectionCards={
 'collect-items':['collect-weapons','collect-armor'],
 'heal-item':['collect-herbs','collect-springs'],
};
export function migrateRetiredCards(s,original){
 const owned=new Set(original.ownedCards||[]),discovered=new Set(original.profile?.cards||[]);
 for(const r of original.orders||[]){const id=r.effect?.id||r.id;if(retiredCollectionCards[id])owned.add('action:'+id);}
 if(original.mode==='collect'&&original.version<3)owned.add('action:collect-items');
 for(const [id,replacements]of Object.entries(retiredCollectionCards)){
  const key='action:'+id;if(owned.has(key))for(const replacement of replacements)if(!s.ownedCards.includes('action:'+replacement))s.ownedCards.push('action:'+replacement);
  if(discovered.has(key)||owned.has(key))for(const replacement of replacements)if(!s.profile.cards.includes('action:'+replacement))s.profile.cards.push('action:'+replacement);
 }
 s.orders=s.orders.map(legacyToCards);
 for(const r of s.orders){const replacement=retiredCollectionCards[r.effect?.id];if(replacement)r.effect.id=replacement[0];}
 for(const i of s.items){const id=i.cardId?.replace('action:',''),replacement=retiredCollectionCards[id];if(replacement)i.cardId='action:'+replacement[(i.x+i.y)%2];}
 s.ownedCards=s.ownedCards.filter(k=>!Object.keys(retiredCollectionCards).some(id=>k==='action:'+id));
 s.profile.cards=s.profile.cards.filter(k=>!Object.keys(retiredCollectionCards).some(id=>k==='action:'+id));
}
