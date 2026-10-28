import {targetCards,conditionCards,conditionById,actionCards,skillCards,cardCapacity,conditionDefault,legacyToCards,effectUnlocked,createCardRule,describeCardRule,replaceCardRule,addCardRule} from './card-orders.js';
import {placeCard,moveCardRow} from './card-placement.js';

const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const option=(id,name,current,disabled=false)=>`<option value="${id}" ${id===current?'selected':''} ${disabled?'disabled':''}>${esc(name)}</option>`;
const paletteGroups={target:['対象',targetCards],condition:['条件',conditionCards],action:['行動',actionCards],skill:['スキル',skillCards]};
const sourceFor=(type,id)=>`palette|${type}|${id}`;
const parseSource=value=>{const p=value?.split('|')||[];if(p[0]==='palette')return {origin:'palette',type:p[1],id:p[2]};if(p[0]==='slot')return {origin:'slot',row:Number(p[1]),slot:p[2],index:Number(p[3])};return null;};
const parseDestination=value=>{const p=value?.split('|')||[];return {row:Number(p[0]),slot:p[1],index:Number(p[2])};};
function selectSource(host,value){host.dataset.cardSource=value||'';host.querySelectorAll('[data-drag-source]').forEach(el=>el.classList.toggle('selected-card',el.dataset.dragSource===value));const status=host.querySelector('[data-card-status]');if(status){const p=value?.split('|')||[],card=p[0]==='palette'?paletteGroups[p[1]]?.[1].find(c=>c.id===p[2]):null;status.textContent=value?(card?`${card.name}：${card.detail||'配置先を選んでください。'}`:'配置先のカードを選ぶか、ドラッグしてください。'):'カードを選び、配置先へドラッグまたはタップしてください。';}}
function applySource(host,s,source,target){
 const row=target.closest('[data-drop-row]'),spot=target.closest('[data-drop-slot]');let ok=false;
 if(source?.startsWith('row|')&&row)ok=moveCardRow(s,Number(source.split('|')[1]),Number(row.dataset.dropRow));
 else if(spot)ok=placeCard(s,parseSource(source),parseDestination(spot.dataset.dropSlot));
 host.dataset.cardMessage=ok?'カードを配置しました。':'その組み合わせには配置できません。対象・取得状況・条件の重複・枠数を確認してください。';selectSource(host,'');return ok;
}
function renderCardBoard(host,s,capacity){
 const group=paletteGroups[host.dataset.cardGroup]?host.dataset.cardGroup:'target',entries=paletteGroups[group][1];
 const message=host.dataset.cardMessage||'カードを選び、配置先へドラッグまたはタップしてください。';
 const card=(src,label,detail,disabled=false)=>`<button type="button" class="palette-card ${group}" data-card-kind="${group}" data-drag-source="${src}" title="${esc(detail||label)}" ${disabled?'disabled':''}>${esc(label)}${disabled?' <small>未取得</small>':''}</button>`;
 host.innerHTML=`<div class="card-board"><div class="card-board-info">指示 ${s.orders.length} / ${capacity}行 · 1行 ${cardCapacity(s)}枚まで。上の行から順に判定し、条件はすべて満たす必要があります。</div><div class="card-workspace"><section class="card-library" aria-label="カードリスト"><div class="card-library-heading"><strong>カードリスト</strong></div><div class="card-library-tabs" role="group" aria-label="カードの種類">${Object.entries(paletteGroups).map(([id,[name]])=>`<button type="button" data-palette-tab="${id}" class="${id===group?'active':''}" aria-pressed="${id===group}">${name}</button>`).join('')}</div><div class="card-library-list">${entries.map(c=>card(sourceFor(group,c.id),c.name,c.detail||c.name,['action','skill'].includes(group)&&!effectUnlocked(s,c))).join('')}</div></section><section class="card-rules" aria-label="探索指示"><div class="card-rules-heading"><strong>探索指示 ${s.orders.length} / ${capacity}行</strong><button type="button" data-card-op="add-row" ${s.orders.length>=capacity?'disabled':''}>＋指示の行</button></div><p class="card-help" data-card-status role="status">${esc(message)}</p>${s.orders.map((input,index)=>{
  const r=legacyToCards(input),target=targetCards.find(t=>t.id===r.target),effect=(r.effect.kind==='skill'?skillCards:actionCards).find(c=>c.id===r.effect.id);
  const cardSlot=(kind,i,label,cardName)=>`<button type="button" class="board-slot ${kind}" data-card-kind="${kind==='effect'?r.effect.kind:kind}" data-drop-slot="${index}|${kind}|${i}" data-drag-source="slot|${index}|${kind}|${i}" aria-label="指示${index+1} ${label} ${esc(cardName)}"><small>${label}</small><span>${esc(cardName)}</span></button>`;
  const conditions=r.conditions.map((c,ci)=>{const d=conditionById[c.id];return `<div class="condition-wrap">${cardSlot('condition',ci,`条件${ci+1}`,d.name.replace('指定%',c.value+'%').replace('指定数',String(c.value)).replace('指定距離',c.value+'マス').replace('指定ターン',c.value+'ターン'))}${d.param?`<label class="card-value"><input type="number" data-card-field="value" data-condition="${ci}" min="${d.min}" max="${d.max}" step="${d.step}" value="${c.value}" aria-label="指示${index+1}の条件${ci+1}の値"> ${d.unit}</label>`:''}<button type="button" class="condition-remove" data-card-op="remove-condition" data-condition="${ci}" aria-label="指示${index+1}の条件${ci+1}を外す">×</button></div>`;}).join('');
  const empty=r.conditions.length+2<cardCapacity(s)?`<button type="button" class="board-slot empty condition ${r.conditions.length?'compact':''}" data-drop-slot="${index}|condition|${r.conditions.length}" aria-label="指示${index+1}に条件を追加">${r.conditions.length?'＋':'＋ 条件（なしで常に）'}</button>`:'';
  return `<article class="board-rule" data-card-row="${index}" data-drop-row="${index}"><div class="card-rule-heading"><button type="button" class="row-handle" data-drag-source="row|${index}" data-drop-row="${index}" aria-label="指示${index+1}を移動">${index+1}</button><span>${r.conditions.length+2} / ${cardCapacity(s)}枚</span><button type="button" data-rule-op="up" data-index="${index}" aria-label="指示${index+1}を上へ" ${index===0?'disabled':''}>↑</button><button type="button" data-rule-op="down" data-index="${index}" aria-label="指示${index+1}を下へ" ${index===s.orders.length-1?'disabled':''}>↓</button><button type="button" data-rule-op="remove" data-index="${index}">外す</button></div><div class="board-slots">${conditions}${empty}<span class="card-connector">なら</span>${cardSlot('target',0,'対象',target.name)}<span class="card-connector">は</span>${cardSlot('effect',0,r.effect.kind==='skill'?'スキル':'行動',effect.name)}</div><p class="card-rule-preview">${esc(describeCardRule(r))}</p></article>`;
 }).join('')}</section><aside class="forecast-panel" aria-label="探索の予測"><div class="forecast-heading"><h3>探索の予測</h3><select id="forecast-samples" aria-label="予測の試行回数"><option value="8">8回</option><option value="16">16回</option><option value="24">24回</option></select></div><div id="forecast-result" role="status" aria-live="polite">予測を準備しています…</div><p class="forecast-disclaimer">現在の階を試行した参考値です。未発見の敵や品物の位置は表示しません。</p><div class="forecast-actions"><button type="button" data-orders-undo>指示を元に戻す</button><button type="button" data-forecast-run>再予測</button></div></aside></div><p class="card-help">視界条件は行動対象を判定。通常は隣接戦闘を優先し、戦術・罠回避は条件付きの補助行動です。探索中は編集できません。</p></div>`;
}
export function renderCardEditor(host,s,capacity){
 const editable=s.phase==='prepare',disabled=editable?'':'disabled';
 const signature=JSON.stringify([s.orders,s.levels,s.abilities,s.unlockedOrders,s.phase]);
 if(host.dataset.orderSignature===signature)return;host.dataset.orderSignature=signature;
 if(editable){renderCardBoard(host,s,capacity);return;}
 host.innerHTML=`<div class="card-order-editor"><p class="section-caption">指示 ${s.orders.length} / ${capacity}行 · 1行 ${cardCapacity(s)}枚まで（ターゲット1枚＋条件＋行動／スキル1枚）。<br>上から実行可能な指示を1つ選びます。条件はすべて成立が必要です。<br>${editable?'準備中だけ編集できます。行数とカード数は別々に拡張できます。':'探索中は閲覧のみ。ひとやすみ中も変更できません。'}</p>${s.orders.map((input,index)=>{
  const r=legacyToCards(input),effects=r.effect.kind==='skill'?skillCards:actionCards;
  return `<article class="rule-card card-rule" data-card-row="${index}"><div class="card-rule-heading"><strong>指示 ${index+1}</strong><span>${r.conditions.length+2} / ${cardCapacity(s)}枚</span><button data-rule-op="up" data-index="${index}" aria-label="指示${index+1}を上へ" ${!editable||index===0?'disabled':''}>↑</button><button data-rule-op="down" data-index="${index}" aria-label="指示${index+1}を下へ" ${!editable||index===s.orders.length-1?'disabled':''}>↓</button><button data-rule-op="remove" data-index="${index}" ${disabled}>外す</button></div><div class="instruction-cards"><label class="instruction-card target-card"><small>ターゲットカード</small><select data-card-field="target" aria-label="指示${index+1}のターゲット" ${disabled}>${targetCards.map(t=>option(t.id,t.name,r.target)).join('')}</select></label>${r.conditions.map((c,ci)=>{const d=conditionById[c.id];return `<div class="instruction-card condition-card"><small>条件カード ${ci+1} · AND</small><select data-card-field="condition" data-condition="${ci}" aria-label="指示${index+1}の条件${ci+1}" ${disabled}>${conditionCards.map(d=>option(d.id,d.name,c.id,r.target==='self'&&['one-hit','injured'].includes(d.id)||r.conditions.some((c,j)=>j!==ci&&c.id===d.id))).join('')}</select>${d.param?`<label><input type="number" data-card-field="value" data-condition="${ci}" min="${d.min}" max="${d.max}" step="${d.step}" value="${c.value}" aria-label="指示${index+1}の条件${ci+1}の値" ${disabled}> ${d.unit}</label>`:''}<button data-card-op="remove-condition" data-condition="${ci}" ${disabled}>条件を外す</button></div>`;}).join('')}<label class="instruction-card effect-card"><small>実行カード</small><select data-card-field="kind" aria-label="指示${index+1}の実行種別" ${disabled}>${option('action','アクションカード',r.effect.kind)}${option('skill','スキルカード',r.effect.kind,r.target!=='self'||!skillCards.some(e=>effectUnlocked(s,e)))}</select><select data-card-field="effect" aria-label="指示${index+1}の実行内容" ${disabled}>${effects.map(e=>option(e.id,e.name+(effectUnlocked(s,e)?'':'（未取得）'),r.effect.id,Boolean(e.enemy)!==(r.target!=='self')||!effectUnlocked(s,e))).join('')}</select></label></div><button data-card-op="add-condition" ${!editable||r.conditions.length+2>=cardCapacity(s)?'disabled':''}>＋条件カード</button><p class="card-rule-preview">${esc(describeCardRule(r))}</p></article>`;
 }).join('')}<button class="rule-add" data-card-op="add-row" ${!editable||s.orders.length>=capacity?'disabled':''}>＋指示の行を追加</button><p class="section-caption">「視界内」は、行動先の階段・宝箱・敵・トラップを現在見えているかで判定します。通常の移動より隣接戦闘を優先します。該当指示がなければ基本探索を行います。戦術と罠回避は条件成立中の補助行動で、ターンを消費しません。</p></div>`;
}

export function handleCardClick(e,s){
 const host=e.currentTarget,tab=e.target.closest('[data-palette-tab]');
 if(tab&&s.phase==='prepare'){host.dataset.cardGroup=tab.dataset.paletteTab;host.dataset.cardMessage='';selectSource(host,'');return true;}
 const source=e.target.closest('[data-drag-source]'),spot=e.target.closest('[data-drop-slot]'),row=e.target.closest('[data-drop-row]');
 if(s.phase==='prepare'&&(source||spot)){
  if(host.dataset.ignoreCardClick==='1')return 'selected';
  const selected=host.dataset.cardSource;
  if(selected&&((selected.startsWith('row|')&&row)||(spot&&!selected.startsWith('row|')))){applySource(host,s,selected,e.target);return true;}
  if(source){selectSource(host,selected===source.dataset.dragSource?'':source.dataset.dragSource);return 'selected';}
  host.dataset.cardMessage='先にカードリストからカードを選んでください。';return true;
 }
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

// Pointer Events support mouse, pen and touch. The same buttons remain clickable for keyboard/tap.
export function installCardDragging(host,getState,onCommit){
 let pending=null,ghost=null;
 host.addEventListener('pointerdown',e=>{
  const source=e.target.closest('[data-drag-source]');if(!source||source.disabled||getState().phase!=='prepare'||e.button!==0)return;
  pending={id:e.pointerId,source:source.dataset.dragSource,x:e.clientX,y:e.clientY,dragging:false};
 });
 document.addEventListener('pointermove',e=>{
  if(!pending||pending.id!==e.pointerId)return;
  if(!pending.dragging&&Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>7){pending.dragging=true;ghost=document.createElement('div');ghost.className='card-drag-ghost';ghost.textContent=host.querySelector('[data-drag-source="'+pending.source+'"]')?.textContent?.trim()||'カード';document.body.appendChild(ghost);}
  if(!pending.dragging)return;e.preventDefault();ghost.style.transform=`translate(${e.clientX+12}px,${e.clientY+12}px)`;
  const under=document.elementFromPoint(e.clientX,e.clientY),scroll=under?.closest('.card-library-list,.card-rules');if(scroll){const r=scroll.getBoundingClientRect();if(e.clientY<r.top+24)scroll.scrollTop-=12;else if(e.clientY>r.bottom-24)scroll.scrollTop+=12;}
 },{passive:false});
 document.addEventListener('pointerup',e=>{
  if(!pending||pending.id!==e.pointerId)return;const drag=pending;pending=null;if(!drag.dragging)return;
  const target=document.elementFromPoint(e.clientX,e.clientY);ghost?.remove();ghost=null;
  host.dataset.ignoreCardClick='1';setTimeout(()=>{delete host.dataset.ignoreCardClick;},0);
  if(target&&host.contains(target)){applySource(host,getState(),drag.source,target);onCommit();}
 });
 document.addEventListener('pointercancel',()=>{pending=null;ghost?.remove();ghost=null;});
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
