import {targetCards,conditionCards,conditionById,actionCards,skillCards,cardCapacity,conditionDefault,legacyToCards,effectUnlocked,createCardRule,describeCardRule,replaceCardRule,addCardRule} from './card-orders.js';

const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const option=(id,name,current,disabled=false)=>`<option value="${id}" ${id===current?'selected':''} ${disabled?'disabled':''}>${esc(name)}</option>`;
export function renderCardEditor(host,s,capacity){
 const editable=s.phase==='prepare',disabled=editable?'':'disabled';
 const signature=JSON.stringify([s.orders,s.levels,s.abilities,s.unlockedOrders,s.phase]);
 if(host.dataset.orderSignature===signature)return;host.dataset.orderSignature=signature;
 host.innerHTML=`<div class="card-order-editor"><p class="section-caption">指示 ${s.orders.length} / ${capacity}行 · 1行 ${cardCapacity(s)}枚まで（ターゲット1枚＋条件＋行動／スキル1枚）。<br>上から実行可能な指示を1つ選びます。条件はすべて成立が必要です。<br>${editable?'準備中だけ編集できます。行数とカード数は別々に拡張できます。':'探索中は閲覧のみ。ひとやすみ中も変更できません。'}</p>${s.orders.map((input,index)=>{
  const r=legacyToCards(input),effects=r.effect.kind==='skill'?skillCards:actionCards;
  return `<article class="rule-card card-rule" data-card-row="${index}"><div class="card-rule-heading"><strong>指示 ${index+1}</strong><span>${r.conditions.length+2} / ${cardCapacity(s)}枚</span><button data-rule-op="up" data-index="${index}" aria-label="指示${index+1}を上へ" ${!editable||index===0?'disabled':''}>↑</button><button data-rule-op="down" data-index="${index}" aria-label="指示${index+1}を下へ" ${!editable||index===s.orders.length-1?'disabled':''}>↓</button><button data-rule-op="remove" data-index="${index}" ${disabled}>外す</button></div><div class="instruction-cards"><label class="instruction-card target-card"><small>ターゲットカード</small><select data-card-field="target" aria-label="指示${index+1}のターゲット" ${disabled}>${targetCards.map(t=>option(t.id,t.name,r.target)).join('')}</select></label>${r.conditions.map((c,ci)=>{const d=conditionById[c.id];return `<div class="instruction-card condition-card"><small>条件カード ${ci+1} · AND</small><select data-card-field="condition" data-condition="${ci}" aria-label="指示${index+1}の条件${ci+1}" ${disabled}>${conditionCards.map(d=>option(d.id,d.name,c.id,r.target==='self'&&['one-hit','injured'].includes(d.id)||r.conditions.some((c,j)=>j!==ci&&c.id===d.id))).join('')}</select>${d.param?`<label><input type="number" data-card-field="value" data-condition="${ci}" min="${d.min}" max="${d.max}" step="${d.step}" value="${c.value}" aria-label="指示${index+1}の条件${ci+1}の値" ${disabled}> ${d.unit}</label>`:''}<button data-card-op="remove-condition" data-condition="${ci}" ${disabled}>条件を外す</button></div>`;}).join('')}<label class="instruction-card effect-card"><small>実行カード</small><select data-card-field="kind" aria-label="指示${index+1}の実行種別" ${disabled}>${option('action','アクションカード',r.effect.kind)}${option('skill','スキルカード',r.effect.kind,r.target!=='self'||!skillCards.some(e=>effectUnlocked(s,e)))}</select><select data-card-field="effect" aria-label="指示${index+1}の実行内容" ${disabled}>${effects.map(e=>option(e.id,e.name+(effectUnlocked(s,e)?'':'（未取得）'),r.effect.id,Boolean(e.enemy)!==(r.target!=='self')||!effectUnlocked(s,e))).join('')}</select></label></div><button data-card-op="add-condition" ${!editable||r.conditions.length+2>=cardCapacity(s)?'disabled':''}>＋条件カード</button><p class="card-rule-preview">${esc(describeCardRule(r))}</p></article>`;
 }).join('')}<button class="rule-add" data-card-op="add-row" ${!editable||s.orders.length>=capacity?'disabled':''}>＋指示の行を追加</button><p class="section-caption">「視界内」は、行動先の階段・宝箱・敵・トラップを現在見えているかで判定します。通常の移動より隣接戦闘を優先します。該当指示がなければ基本探索を行います。戦術と罠回避は条件成立中の補助行動で、ターンを消費しません。</p></div>`;
}

export function handleCardClick(e,s){
 const b=e.target.closest('[data-card-op]');if(!b)return null;
 if(b.disabled||s.phase!=='prepare')return false;
 if(b.dataset.cardOp==='add-row')return addCardRule(s);
 const index=Number(b.closest('[data-card-row]').dataset.cardRow),r=legacyToCards(s.orders[index]);
 if(b.dataset.cardOp==='add-condition'){
  const d=conditionCards.find(d=>!r.conditions.some(c=>c.id===d.id)&&(r.target!=='self'||!['one-hit','injured'].includes(d.id)));
  if(!d)return false;r.conditions.push(conditionDefault(d.id));
 }else if(b.dataset.cardOp==='remove-condition')r.conditions.splice(Number(b.dataset.condition),1);
 return replaceCardRule(s,index,r);
}
export function handleCardChange(e,s){
 const input=e.target;if(!input.dataset.cardField)return null;
 if(s.phase!=='prepare')return false;
 const index=Number(input.closest('[data-card-row]').dataset.cardRow),r=legacyToCards(s.orders[index]),ci=Number(input.dataset.condition);
 switch(input.dataset.cardField){
  case'target':r.target=input.value;r.conditions=r.conditions.filter(c=>r.target!=='self'||!['one-hit','injured'].includes(c.id));r.effect=r.target==='self'?{kind:'action',id:'stairs'}:{kind:'action',id:'attack'};break;
  case'kind':r.effect={kind:input.value,id:input.value==='skill'?skillCards.find(e=>effectUnlocked(s,e))?.id:'stairs'};break;
  case'effect':r.effect.id=input.value;break;
  case'condition':r.conditions[ci]=conditionDefault(input.value);break;
  case'value':r.conditions[ci].value=Number(input.value);break;
 }
 return replaceCardRule(s,index,r);
}
