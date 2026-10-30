import {targetCards,conditionCards,conditionById,actionCards,skillCards,cardCapacity,conditionDefault,legacyToCards,effectUnlocked,createCardRule,describeCardRule,replaceCardRule,addCardRule} from './card-orders.js';
import {placeCard,moveCardRow,canPlaceCard,removePlacedCard} from './card-placement.js';

const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const option=(id,name,current,disabled=false)=>`<option value="${id}" ${id===current?'selected':''} ${disabled?'disabled':''}>${esc(name)}</option>`;
const paletteGroups={target:['ターゲット',targetCards],condition:['条件',conditionCards],action:['アクション',actionCards],skill:['スキル',skillCards]};
const sourceFor=(type,id)=>`palette|${type}|${id}`;
const parseSource=(value,host)=>{const p=value?.split('|')||[];if(p[0]==='row')return {origin:'row',row:Number(p[1])};if(p[0]==='palette'){let values={};try{values=JSON.parse(host?.dataset.conditionValues||'{}');}catch{}return {origin:'palette',type:p[1],id:p[2],...(values[p[2]]===undefined?{}:{value:values[p[2]]})};}if(p[0]==='slot')return {origin:'slot',row:Number(p[1]),slot:p[2],index:Number(p[3])};return null;};
const parseDestination=value=>{const p=value?.split('|')||[];return {row:Number(p[0]),slot:p[1],index:Number(p[2]),insert:p[3]==='insert'};};
function updateDropHints(host,s,value){
 const source=parseSource(value,host);host.classList.toggle('placing-condition',Boolean(source&&(source.type==='condition'||source.slot==='condition')));host.querySelectorAll('[data-drop-slot]').forEach(el=>{const active=Boolean(source),valid=active&&source.origin!=='row'&&canPlaceCard(s,source,parseDestination(el.dataset.dropSlot));el.classList.toggle('valid-drop',valid);el.classList.toggle('invalid-drop',active&&source.origin!=='row'&&!valid);});
 host.querySelectorAll('[data-drop-row]').forEach(el=>el.classList.toggle('row-drop-ready',source?.origin==='row'));
 const trash=host.querySelector('[data-drop-trash]');if(trash){const removable=source&&(source.origin==='row'||source.origin==='slot');trash.disabled=!removable;trash.classList.toggle('valid-drop',Boolean(removable));}
}
function conditionSettings(host,s,value){
 const panel=host.querySelector('[data-condition-settings]');if(!panel)return;
 const source=parseSource(value,host),placed=source?.origin==='slot'&&source.slot==='condition',condition=placed?legacyToCards(s.orders[source.row]).conditions[source.index]:null;
 const d=conditionById[condition?.id||(source?.type==='condition'?source.id:'')];
 panel.hidden=!d;if(!d){panel.innerHTML='';return;}
 const field=placed?'value':'palette-value',amount=condition?.value??source.value??d.value;
 panel.innerHTML=`<div ${placed?`data-card-row="${source.row}"`:''}><strong>${esc(d.name)}</strong>${d.param?`<label>値 <input type="number" data-card-field="${field}" data-condition="${source.index??0}" data-condition-id="${d.id}" min="${d.min}" max="${d.max}" step="${d.step}" value="${amount}" aria-label="${esc(d.name)}の値"> ${esc(d.unit)}</label><small>${d.min}〜${d.max} · ${d.step}刻み${placed?'':'／次に置くカードへ適用'}</small>`:'<p>この条件には数値の設定はありません。</p>'}<button type="button" data-close-condition aria-label="条件の設定を閉じる">×</button></div>`;
}
function selectSource(host,value,s,showSettings=true){
 host.dataset.cardSource=value||'';host.querySelectorAll('[data-drag-source]').forEach(el=>el.classList.toggle('selected-card',el.dataset.dragSource===value));
 const status=host.querySelector('[data-card-status]');if(status){const p=value?.split('|')||[],card=p[0]==='palette'?paletteGroups[p[1]]?.[1].find(c=>c.id===p[2]):null;status.textContent=value?(card?`${card.name}：${card.detail||'光っている溝へ配置できます。'}`:'カードリストへ戻すと外せます。対象・実行カードを外すと行ごと削除します。'):'カードを選び、光る配置先へドラッグまたはタップしてください。';}
 if(s){updateDropHints(host,s,value);if(showSettings)conditionSettings(host,s,value);}
}
function applySource(host,s,source,target){
 const row=target.closest('[data-drop-row]'),spot=target.closest('[data-drop-slot]');let ok=false;
 if(target.closest('[data-drop-trash],[data-drop-return]'))ok=removePlacedCard(s,parseSource(source,host));
 else if(source?.startsWith('row|')&&row)ok=moveCardRow(s,Number(source.split('|')[1]),Number(row.dataset.dropRow));
 else if(spot)ok=placeCard(s,parseSource(source,host),parseDestination(spot.dataset.dropSlot));
 host.dataset.cardMessage=ok?'指示を更新しました。':'その組み合わせには配置できません。対象・取得状況・条件の重複・枠数を確認してください。';selectSource(host,'',s);return ok;
}
function conditionName(c){const d=conditionById[c.id];return d.name.replace('指定%',c.value+'%').replace('指定数',String(c.value)).replace('指定距離',c.value+'マス').replace('指定ターン',c.value+'ターン');}
function renderCardBoard(host,s,capacity){
 const group=paletteGroups[host.dataset.cardGroup]?host.dataset.cardGroup:'target',entries=paletteGroups[group][1];
 const message=host.dataset.cardMessage||'カードを選び、光る配置先へドラッグまたはタップしてください。';
 const card=(c)=>{const disabled=['action','skill'].includes(group)&&!effectUnlocked(s,c);return `<button type="button" class="palette-card ${group}" data-card-kind="${group}" data-drag-source="${sourceFor(group,c.id)}" title="${esc(c.detail||c.name)}" ${disabled?'disabled':''}><span class="card-content"><span class="card-content-text">${esc(c.name)}</span></span>${disabled?'<em>未取得</em>':''}</button>`;};
 host.innerHTML=`<div class="card-board fitted-card-editor"><div class="card-board-info">指示 ${s.orders.length} / ${capacity}行 · 1行 ${cardCapacity(s)}枚まで · 上の行から判定／条件はすべて成立</div><div class="card-workspace"><section class="card-library" data-drop-return aria-label="カードリスト・カードを戻して外す"><strong>カードリスト</strong><div class="card-library-tabs" role="group" aria-label="カードの種類">${Object.entries(paletteGroups).map(([id,[name]])=>`<button type="button" data-palette-tab="${id}" class="${id===group?'active':''}" aria-pressed="${id===group}">${name}</button>`).join('')}</div><p class="card-return-hint">配置済みカードをここへ戻すと外せます</p><div class="card-library-list">${entries.map(card).join('')}</div></section><section class="card-rules" aria-label="探索指示"><div class="card-rules-heading"><strong>探索指示 ${s.orders.length} / ${capacity}行</strong><div><button type="button" data-orders-undo>元に戻す</button><button type="button" data-drop-trash disabled>ここへ移動して外す</button><button type="button" data-card-op="add-row" ${s.orders.length>=capacity?'disabled':''}>＋指示の行</button></div></div><p class="card-help" data-card-status role="status">${esc(message)}</p><section class="condition-settings" data-condition-settings aria-label="条件の設定" hidden></section><div class="instruction-trays">${s.orders.map((input,index)=>{
  const r=legacyToCards(input),target=targetCards.find(t=>t.id===r.target),effect=(r.effect.kind==='skill'?skillCards:actionCards).find(c=>c.id===r.effect.id);
  const cardSlot=(kind,i,label,name)=>`<button type="button" class="board-slot ${kind}" data-card-kind="${kind==='effect'?r.effect.kind:kind}" data-drop-slot="${index}|${kind}|${i}" data-drag-source="slot|${index}|${kind}|${i}" title="${esc(name)}" aria-label="指示${index+1} ${label} ${esc(name)}"><small class="visually-hidden">${label}</small><span class="card-content"><span class="card-content-text">${esc(name)}</span></span></button>`;
  const insertion=i=>r.conditions.length+2<cardCapacity(s)?`<span class="condition-insertion"><button type="button" class="insert-condition" data-insert-condition data-drop-slot="${index}|condition|${i}|insert" aria-label="指示${index+1}の条件${i+1}の位置に追加">＋条件</button></span>`:'';
  const conditions=r.conditions.map((c,ci)=>insertion(ci)+cardSlot('condition',ci,`条件${ci+1}`,conditionName(c))).join('');
  const empty=insertion(r.conditions.length);
  return `<article class="board-rule" data-card-row="${index}" data-drop-row="${index}"><div class="tray-scroll" tabindex="0" aria-label="指示${index+1}のカード列・横スクロール"><div class="tray-surface"><button type="button" class="row-handle" data-drag-source="row|${index}" data-drop-row="${index}" aria-label="指示${index+1}を移動">${index+1}</button><div class="board-slots">${cardSlot('target',0,'ターゲット',target.name)}${conditions}${empty}${cardSlot('effect',0,r.effect.kind==='skill'?'スキル':'アクション',effect.name)}</div></div></div><div class="tray-caption"><span>${r.conditions.length+2} / ${cardCapacity(s)}枚 · ${esc(describeCardRule(r))}</span></div></article>`;
 }).join('')}</div></section></div><p class="card-help">番号で行を並べ替え。カードを一覧へ戻して外す（対象・実行は行ごと削除）。探索中は編集できません。</p></div>`;
 selectSource(host,'',s);
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
 if(tab&&s.phase==='prepare'){host.dataset.cardGroup=tab.dataset.paletteTab;host.dataset.cardMessage='';selectSource(host,'',s);return true;}
 if(e.target.closest('[data-close-condition]')){selectSource(host,'',s);return 'selected';}
 if(e.target.closest('[data-drop-trash]')&&s.phase==='prepare'){applySource(host,s,host.dataset.cardSource,e.target);return true;}
 const insertion=e.target.closest('[data-insert-condition]');if(insertion&&s.phase==='prepare'&&!host.dataset.cardSource){host.dataset.cardGroup='condition';host.dataset.cardMessage='追加する条件を選び、追加口へ配置してください。';return true;}
 const source=e.target.closest('[data-drag-source]'),spot=e.target.closest('[data-drop-slot]'),row=e.target.closest('[data-drop-row]');
 if(s.phase==='prepare'&&(source||spot)){
  if(host.dataset.ignoreCardClick==='1')return 'selected';
  const selected=host.dataset.cardSource;
  if(selected&&((selected.startsWith('row|')&&row)||(spot&&!selected.startsWith('row|')))){applySource(host,s,selected,e.target);return true;}
  if(source){selectSource(host,selected===source.dataset.dragSource?'':source.dataset.dragSource,s);return 'selected';}
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
 const clearDrag=drag=>{host.querySelector('[data-drop-return]')?.classList.remove('return-ready');drag?.element?.classList.remove('is-drag-source');ghost?.remove();ghost=null;host.querySelectorAll('.drop-hover').forEach(el=>el.classList.remove('drop-hover'));};
 host.addEventListener('pointerdown',e=>{
  const source=e.target.closest('[data-drag-source]');if(!source||source.disabled||getState().phase!=='prepare'||e.button!==0)return;
  const rect=source.getBoundingClientRect(),style=getComputedStyle(source),width=parseFloat(style.width),height=parseFloat(style.height);
  pending={id:e.pointerId,source:source.dataset.dragSource,element:source,style,width,height,scale:rect.width/width,grabX:e.clientX-rect.left,grabY:e.clientY-rect.top,x:e.clientX,y:e.clientY,dragging:false};
 });
 document.addEventListener('pointermove',e=>{
  if(!pending||pending.id!==e.pointerId)return;
  if(!pending.dragging&&Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>7){
   pending.dragging=true;selectSource(host,pending.source,getState(),false);
   ghost=document.createElement('div');ghost.className='card-drag-ghost fitted-card-editor';ghost.setAttribute('aria-hidden','true');
   const clone=pending.element.cloneNode(true),cs=pending.style;clone.classList.remove('selected-card','valid-drop','invalid-drop','drop-hover');clone.removeAttribute('id');clone.tabIndex=-1;
   Object.assign(clone.style,{width:pending.width+'px',height:pending.height+'px',minWidth:'0',minHeight:'0',margin:'0',flex:'none',opacity:'1',position:'relative',font:cs.font,color:cs.color,padding:cs.padding,border:cs.border,backgroundImage:cs.backgroundImage,backgroundSize:cs.backgroundSize,backgroundPosition:cs.backgroundPosition,pointerEvents:'none'});
   ghost.style.width=pending.width+'px';ghost.style.height=pending.height+'px';ghost.appendChild(clone);document.body.appendChild(ghost);pending.element.classList.add('is-drag-source');
  }
  if(!pending.dragging)return;e.preventDefault();ghost.style.transform=`translate(${e.clientX-pending.grabX}px,${e.clientY-pending.grabY}px) scale(${pending.scale})`;
  const under=document.elementFromPoint(e.clientX,e.clientY),scroll=under?.closest('.card-library-list,.instruction-trays,.card-rules');if(scroll){const r=scroll.getBoundingClientRect();if(e.clientY<r.top+24)scroll.scrollTop-=12;else if(e.clientY>r.bottom-24)scroll.scrollTop+=12;}
  host.querySelector('[data-drop-return]')?.classList.toggle('return-ready',pending.source.startsWith('slot|')||pending.source.startsWith('row|'));host.querySelectorAll('.drop-hover').forEach(el=>el.classList.remove('drop-hover'));under?.closest('.valid-drop,[data-drop-row].row-drop-ready')?.classList.add('drop-hover');
  const horizontal=under?.closest('.tray-scroll');if(horizontal){const r=horizontal.getBoundingClientRect();if(e.clientX<r.left+32)horizontal.scrollLeft-=16;else if(e.clientX>r.right-32)horizontal.scrollLeft+=16;}
 },{passive:false});
 document.addEventListener('pointerup',e=>{
  if(!pending||pending.id!==e.pointerId)return;const drag=pending;pending=null;if(!drag.dragging)return;
  const target=document.elementFromPoint(e.clientX,e.clientY);clearDrag(drag);
  host.dataset.ignoreCardClick='1';setTimeout(()=>{delete host.dataset.ignoreCardClick;},0);
  if(target&&host.contains(target)){applySource(host,getState(),drag.source,target);onCommit();}
 });
 const cancel=()=>{clearDrag(pending);pending=null;selectSource(host,'',getState());};
 document.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);
}
export function handleCardChange(e,s){
 const input=e.target;if(!input.dataset.cardField)return null;
 if(s.phase!=='prepare')return false;
 if(!input.checkValidity()){input.reportValidity();return 'selected';}
 if(input.dataset.cardField==='palette-value'){
  const d=conditionById[input.dataset.conditionId],n=Number(input.value);if(!d?.param||!Number.isFinite(n)||n<d.min||n>d.max||(n-d.min)%d.step!==0)return false;
  let values={};try{values=JSON.parse(e.currentTarget.dataset.conditionValues||'{}');}catch{}values[d.id]=n;e.currentTarget.dataset.conditionValues=JSON.stringify(values);return 'selected';
 }
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
