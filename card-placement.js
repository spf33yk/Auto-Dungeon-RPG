import {targetCards,conditionById,actionCards,skillCards,conditionDefault,legacyToCards,validCardRule,effectUnlocked} from './card-orders.js';

// Editing is atomic: invalid or locked combinations leave every rule untouched.
export function placeCard(s,source,destination){
 if(s.phase!=='prepare'||!source||!destination||!Number.isInteger(destination.row)||!s.orders[destination.row])return false;
 const rows=s.orders.map(legacyToCards),dest=rows[destination.row],slot=destination.slot;
 if(!['target','condition','effect'].includes(slot))return false;
 const ci=Number(destination.index);if(slot==='condition'&&(!Number.isInteger(ci)||ci<0||ci>dest.conditions.length))return false;
 if(source.origin==='palette'){
  if(source.type==='target'&&slot==='target'&&targetCards.some(c=>c.id===source.id)){
   if(dest.target!==source.id){dest.target=source.id;dest.conditions=dest.conditions.filter(c=>dest.target!=='self'||!['one-hit','injured'].includes(c.id));dest.effect=dest.target==='self'?{kind:'action',id:'stairs'}:{kind:'action',id:'attack'};}
  }else if(source.type==='condition'&&slot==='condition'&&conditionById[source.id]){
   const value=conditionDefault(source.id);if(source.value!==undefined&&conditionById[source.id].param)value.value=source.value;if(destination.insert)dest.conditions.splice(ci,0,value);else if(ci===dest.conditions.length)dest.conditions.push(value);else dest.conditions[ci]=value;
  }else if(['action','skill'].includes(source.type)&&slot==='effect'){
   const list=source.type==='action'?actionCards:skillCards,card=list.find(c=>c.id===source.id);
   if(!effectUnlocked(s,card))return false;dest.effect={kind:source.type,id:source.id};
  }else return false;
 }else if(source.origin==='slot'){
  const si=Number(source.index),sr=Number(source.row);if(!Number.isInteger(sr)||!rows[sr]||source.slot!==slot)return false;
  const from=rows[sr];
  if(slot==='condition'){
   if(!Number.isInteger(si)||si<0||si>=from.conditions.length)return false;
   if(sr===destination.row){const [item]=from.conditions.splice(si,1);const targetIndex=destination.insert&&si<ci?ci-1:ci;from.conditions.splice(Math.min(targetIndex,from.conditions.length),0,item);}
   else if(destination.insert){dest.conditions.splice(ci,0,from.conditions.splice(si,1)[0]);}
   else if(ci===dest.conditions.length){dest.conditions.push(from.conditions.splice(si,1)[0]);}
   else [from.conditions[si],dest.conditions[ci]]=[dest.conditions[ci],from.conditions[si]];
  }else if(slot==='target'){
   [from.target,dest.target]=[dest.target,from.target];
  }else [from.effect,dest.effect]=[dest.effect,from.effect];
 }else return false;
 if(!rows.every(r=>validCardRule(s,r)))return false;
 s.orders=rows;s.mode='custom';return true;
}

export function moveCardRow(s,from,to){
 if(s.phase!=='prepare'||!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=s.orders.length||to>=s.orders.length)return false;
 if(from===to)return true;const [row]=s.orders.splice(from,1);s.orders.splice(to,0,row);s.mode='custom';return true;
}

// placeCard builds new rules before committing, so a shallow state copy is sufficient.
export const canPlaceCard=(s,source,destination)=>placeCard({...s},source,destination);
export function removePlacedCard(s,source){
 if(s.phase!=='prepare'||!source)return false;
 if(source.origin==='row'&&Number.isInteger(source.row)&&s.orders[source.row]){s.orders.splice(source.row,1);s.mode='custom';return true;}
 if(source.origin==='slot'&&Number.isInteger(source.row)&&s.orders[source.row]&&['target','effect'].includes(source.slot)){s.orders.splice(source.row,1);s.mode='custom';return true;}
 if(source.origin==='slot'&&source.slot==='condition'&&Number.isInteger(source.row)&&Number.isInteger(source.index)&&s.orders[source.row]){
  const rows=s.orders.map(legacyToCards);if(!rows[source.row].conditions[source.index])return false;
  rows[source.row].conditions.splice(source.index,1);if(!rows.every(r=>validCardRule(s,r)))return false;s.orders=rows;s.mode='custom';return true;
 }
 return false;
}
