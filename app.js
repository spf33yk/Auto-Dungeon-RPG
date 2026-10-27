import {requestLandscapeDisplay} from './display-mode.js';
import {createLogVisibility} from './log-visibility.js';
import {queueDamage,damageFrame} from './damage-view.js';
import {renderCardEditor,handleCardClick,handleCardChange,installCardDragging} from './card-editor.js';
import {autoMapModel,cameraFor,miniMapGeometry,drawMiniMap} from './map-view.js';
import {thoughtText} from './thought-view.js';
import {memoryGroups} from './skill-tree.js';
import {debugJump,debugHeal,debugShards,debugSkills,debugEquipment} from './debug-tools.js';
import {W,H,skills,newGame,abandonRun,stats,price,upgrade,equip,equipBest,tick,ascend,zoneFor,floorLabel,radius,canSee,gearById,gearStats,gearName,discard,locked,codexRows,sortedInventory,normalizeSave,orderDefinitions,orderById,orderCapacity,cardCapacity,orderUnlocked,addOrder,editOrder,beginExploration,equipment,LAST_FLOOR,LETTER_FLOOR,nextStageHint,rewardDefinitions,grantReward,experienceToNext,MAX_LEVEL,HP_PER_LEVEL,gainExperience} from './engine.js';
const $=id=>document.getElementById(id), key='abyss-normal-v2';
const fieldLogVisibility=createLogVisibility({
 show:()=>{$('field-log-host').classList.remove('is-expired');$('field-log-host').removeAttribute('aria-hidden');},
 hide:()=>{$('field-log-host').classList.add('is-expired');$('field-log-host').setAttribute('aria-hidden','true');}
});
let autoDisplayAttempted=false,ownsFullscreen=false,lockedOrientation=false;
let damagePopups=[],damageScene='';
let state,tab='orders',speed=1,paused=false,last=0,sound=false,volume=35,audio,motion=null,dialogWasPaused=false,gearSlot='weapon',gearSorts={weapon:'acquired',armor:'acquired'},codexKind='monsters',codexSlot='weapon',codexSorts={weapon:'acquired',armor:'acquired'};

const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
try{const data=JSON.parse(localStorage.getItem(key));state=normalizeSave(data);if(state){paused=state.phase==='explore';if(data.version!==state.version){try{const backup=key+'-v'+data.version+'-before-ui';if(!localStorage.getItem(backup))localStorage.setItem(backup,JSON.stringify(data));}catch{}}}}catch{}
state ||= newGame();
function save(){try{localStorage.setItem(key,JSON.stringify(state,(name,value)=>name==='damageEvents'?undefined:value));$('save-status').textContent='端末に保存済み';}catch{$('save-status').textContent='保存できません（空き容量・設定）';}}
function tone(freq=330){if(!sound||volume===0)return;try{audio ||= new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(volume/100*.1,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.15);}catch{}}
// Every sprite is an original pixel matrix. No external game assets are used.
const sprites={
 skeleton:['....hhhhh...','...hbbbbb h..'.replace(' ',''),'...hbdbdbh..','...hbbbbbh..','....hdddh...','.....bb.....','...aabbaa...','..a.abb.a.s.','..a.abb.a.s.','....aaa...s.','....b.b.....','...bb.bb....'],
 slime:['............','............','............','....gggg....','...ggllgg...','..gllllllg..','.gllldldllg.','.glllllllg..','..ggggggg...','............','............','............'],
 brute:['...rrrrrr...','..rppppppr..','..rpdppdpr..','..rppppppr..','...rdddr....','..rrppprr...','.rpprrpppr..','.rpprrpprr..','...rrrrr....','...pp.pp....','..ppp.ppp...','............'],
 chest:['............','............','..yyyyyyyy..','.yoooooooo y.'.replace(' ',''),'.yoooooooo y.'.replace(' ',''),'.yyyyyyyyyy.','.ooooYYoooo.','.ooooYYoooo.','.yooooooooy.','.yyyyyyyyyy.','............','............'],
 potion:['............','.....yy.....','....bbbb....','....bllb....','...bllllb...','...bllllb...','...bllllb...','....bbbb....','............','............','............','............'],
 key:['............','..yyyy......','.y....y.....','.y....y.....','..yyyy......','....y.......','....yyyy....','....y.y.....','....y.......','............','............','............'],
 armor:['............','...aaaaaa...','..aabbbbaa..','.aabbbbbbaa.','.a.bbbbbb.a.','...bbbbbb...','...bbbbbb...','...bbbbbb...','...aaaaaa...','............','............','............'],
 gear:['.........ss.','........ss..','.......ss...','......ss....','.....ss.....','....ss......','..ass.......','...aa.......','..s.aa......','.s..........','............','............'],
 herb:['............','......gg....','..gg.ggg....','..ggggg.....','....gg......','....g.gg....','...ggggg....','....g.......','....g.......','............','............','............'],
 fragment:['............','.....ll.....','....lYYl....','...lYYYYl...','..lYYYYYYl..','...lYYYYl...','....lYYl....','.....ll.....','............','............','............','............'],
 reward:['............','...yyyyyy...','...ybbbbby..','...ybbbbby..','...ybbYbby..','...ybbbbby..','...ybbYbby..','...ybbbbby..','...yyyyyyy..','............','............','............'],
 stairs:['............','.........ll.','.......llbl.','.....llbbbl.','...llbbbbbl.','.llbbbbbbbl.','.lbbbbbbbbl.','.llllllllll.','............','............','............','............']};
const palette={h:'#57695a',b:'#e2dfbd',d:'#27352f',a:'#899e85',s:'#b8b2a1',g:'#3e715f',l:'#9bbba6',r:'#66424a',p:'#ad7276',y:'#bfa266',o:'#634e32',Y:'#e3d49d'};
function sprite(ctx,type,x,y,size=24){const rows=sprites[type]||sprites.reward;const scale=size/12;for(let py=0;py<rows.length;py++)for(let px=0;px<rows[py].length;px++){const c=rows[py][px];if(c!=='.'&&palette[c]){ctx.fillStyle=palette[c];ctx.fillRect(x+px*scale,y+py*scale,Math.ceil(scale),Math.ceil(scale));}}}
const ctx=$('map').getContext('2d');ctx.imageSmoothingEnabled=false;
function draw(){
const scene=state.seed+':'+state.floor;if(damageScene!==scene){damagePopups=[];damageScene=scene;}
const map=$('map'),box=map.getBoundingClientRect();if(box.width>0&&box.height>0){const height=Math.round(744*box.height/box.width);if(map.height!==height){map.height=height;ctx.imageSmoothingEnabled=false;}}
ctx.fillStyle='#0c1416';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);const theme=zoneFor(state);const visible=(x,y)=>canSee(state,x,y);
const progress=motion&&state.phase==='explore'?Math.min(1,(performance.now()-motion.time)/motion.duration):1;
const eased=1-Math.pow(1-progress,3);
const position=motion?{x:motion.from.x+(state.player.x-motion.from.x)*eased,y:motion.from.y+(state.player.y-motion.from.y)*eased}:state.player;
const moving=motion&&(motion.from.x!==state.player.x||motion.from.y!==state.player.y);
const hop=moving?Math.sin(progress*Math.PI)*2:0;
const camera=cameraFor(position,radius(state),ctx.canvas.width,ctx.canvas.height);
ctx.save();ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.left,-camera.top);

for(let y=0;y<H;y++)for(let x=0;x<W;x++){const seen=state.seen[y][x],floor=state.grid[y][x];if(!seen)continue;const px=x*24,py=y*24,n=(x*17+y*31+state.seed)%13;ctx.fillStyle=floor?theme.floorColor:theme.wallColor;ctx.fillRect(px,py,24,24);if(floor){ctx.fillStyle='#172722';ctx.fillRect(px,py,24,1);ctx.fillRect(px,py,1,24);if(n<4){ctx.fillStyle='#435044';ctx.fillRect(px+5+n,py+8,2,2);ctx.fillRect(px+15,py+16,3,1);}if(n===5){ctx.fillStyle='#354b39';ctx.fillRect(px+2,py+15,6,3);}}else{ctx.fillStyle=theme.wallColor;ctx.fillRect(px+1,py+1,22,3);ctx.fillStyle='#182925';ctx.fillRect(px,py+20,24,4);ctx.fillRect(px+11,py+4,2,16);}if(!visible(x,y)){ctx.fillStyle='#071111a8';ctx.fillRect(px,py,24,24);}}
const stair=state.stairs;if(state.seen[stair.y][stair.x]){ctx.fillStyle='#88c2ac19';ctx.fillRect(stair.x*24-4,stair.y*24-4,32,32);sprite(ctx,'stairs',stair.x*24,stair.y*24);}
for(const i of state.items)if(state.seen[i.y][i.x]){ctx.globalAlpha=visible(i.x,i.y)?1:.4;sprite(ctx,i.type==='letter'?'chest':i.type==='gear'&&gearById[i.gear.baseId].slot==='armor'?'armor':i.type,i.x*24,i.y*24);if(i.type==='chest'&&i.locked){ctx.fillStyle='#d8ca8a';ctx.fillRect(i.x*24+10,i.y*24+10,4,5);}if(i.type==='letter'){ctx.fillStyle='#d8ca8a';ctx.fillRect(i.x*24+10,i.y*24+5,4,4);}}ctx.globalAlpha=1;
for(const t of state.traps||[])if(t.revealed&&(state.gimmick?.id==='traps'||state.seen[t.y][t.x])){ctx.fillStyle=t.spent?'#7e7769':'#d7b278';ctx.fillRect(t.x*24+6,t.y*24+14,12,3);ctx.fillStyle='#d1b88b';for(let i=0;i<3;i++)ctx.fillRect(t.x*24+7+i*4,t.y*24+10,2,4);}
for(const e of state.enemies)if(visible(e.x,e.y)){const original={g:palette.g,l:palette.l,r:palette.r,p:palette.p};if(e.type==='slime'){palette.g=theme.wallColor;palette.l='#c0c7b1';}else{palette.r=theme.floorColor;palette.p=theme.wallColor;}sprite(ctx,e.type,e.x*24,e.y*24);if(e.boss){ctx.strokeStyle='#dfba6b';ctx.lineWidth=2;ctx.strokeRect(e.x*24-2,e.y*24-2,28,28);}Object.assign(palette,original);ctx.fillStyle='#a06c70';ctx.fillRect(e.x*24+6,e.y*24+21,12,2);}
ctx.fillStyle='#bfd49e20';ctx.fillRect(position.x*24-4,position.y*24-4,32,32);sprite(ctx,'skeleton',position.x*24,position.y*24-hop);
if(state.flash){ctx.fillStyle=state.flash.kind==='hurt'?'#e49a8c66':'#fff3b766';ctx.fillRect(state.flash.x*24,state.flash.y*24,24,24);}
const now=performance.now();damagePopups=damagePopups.filter(p=>damageFrame(p,now).alive);
for(const p of damagePopups){if(!p.hero&&!visible(p.x,p.y))continue;const frame=damageFrame(p,now),at=p.hero?position:p;
 ctx.save();ctx.globalAlpha=frame.alpha;ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=2.5;ctx.strokeStyle='#200909';ctx.fillStyle='#ff5656';
 const x=at.x*24+12,y=at.y*24-2-frame.rise;ctx.strokeText(String(p.damage),x,y);ctx.fillText(String(p.damage),x,y);ctx.restore();}
ctx.restore();
if(state.gimmick?.id==='fog'){ctx.fillStyle='#a6bdc620';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);}
drawAutoMap();
}
function drawAutoMap(){
 const canvas=$('auto-map'),geometry=miniMapGeometry(W,H,$('map').clientWidth<420?4:6);
 if(canvas.width!==geometry.width||canvas.height!==geometry.height){canvas.width=geometry.width;canvas.height=geometry.height;}
 drawMiniMap(canvas.getContext('2d'),autoMapModel(state,(x,y)=>canSee(state,x,y)),geometry);
}
function renderThoughtSubtitle(){
 const text='▶ '+thoughtText(state.intent),subtitle=$('thought-subtitle');
 if(subtitle.textContent!==text)subtitle.textContent=text;
}
function categoryTabs(type,selected,common=false){return `<div class="subtabs" role="group" aria-label="${type==='skill'?'スキル系統':'装備の種類'}">${(common?[['common','共通'],['weapon','武器'],['armor','防具']]:[['weapon','武器'],['armor','防具']]).map(([id,label])=>`<button data-category="${type}" data-value="${id}" aria-pressed="${selected===id}" class="${selected===id?'active':''}">${label}</button>`).join('')}</div>`;}
function sortButtons(type,selected){return `<div class="sort-controls" role="group" aria-label="装備の並べ替え">${[['acquired','入手順'],['attack','攻撃力順'],['defense','防御力順']].map(([id,label])=>`<button data-sort="${type}" data-value="${id}" class="${selected===id?'active':''}" aria-pressed="${selected===id}">${label} ${id==='acquired'?'↑':'↓'}</button>`).join('')}</div>`;}
function renderOrderEditor(host){renderCardEditor(host,state,orderCapacity(state));}
function handleOrderClick(e,host){const result=handleCardClick(e,state);if(result!==null){if(result!=='selected'){delete host.dataset.orderSignature;render();}return true;}const b=e.target.closest('button');if(!b||b.disabled)return false;if(b.hasAttribute('data-rule-add')){const choice=host.querySelector('[data-order-choice]');if(choice&&addOrder(state,choice.value)){delete host.dataset.orderSignature;render();}return true;}if(b.dataset.ruleOp){editOrder(state,Number(b.dataset.index),b.dataset.ruleOp);delete host.dataset.orderSignature;render();return true;}return false;}
function handleOrderChange(e){const result=handleCardChange(e,state);if(result!==null){delete $('live-orders').dataset.orderSignature;delete $('tab-content').dataset.orderSignature;render();return;}if(e.target.dataset.ruleValue!==undefined){editOrder(state,Number(e.target.dataset.ruleValue),e.target.value);delete $('live-orders').dataset.orderSignature;delete $('tab-content').dataset.orderSignature;render();}}
const displayAttack=()=>state.gear.weapon.identified?stats(state).attack:'？';
const displayDefense=()=>state.gear.armor.identified?stats(state).defense:'？';
function render(){
 const st=stats(state),prep=state.phase==='prepare',theme=zoneFor(state);renderScreens();
 $('floor-title').textContent=`${theme.name} · ${floorLabel(state)}`;
 $('phase-label').textContent=({awakening:'目覚め',prepare:'準備中',explore:paused?'一時停止':'探索中',cleared:'Clear',dead:'記憶喪失',ending:'通常エンド'})[state.phase];
 $('floor-message').hidden=state.floor!==LETTER_FLOOR;$('floor-message').textContent='B15 ― 何か大事なものを忘れている気がする';
 $('turn').textContent=`TURN ${String(state.turn).padStart(3,'0')}`;
 $('hud-shards').textContent=state.shards;$('hud-sight').textContent=radius(state)+'マス';
 $('level-text').textContent='Lv.'+state.level;const expNeed=experienceToNext(state.level);$('exp-bar').style.width=(expNeed?state.experience/expNeed*100:100)+'%';$('level-vitals').setAttribute('aria-label',`レベル${state.level}、経験値${state.experience}、次のレベルまで${expNeed?expNeed-state.experience:0}`);$('level-vitals').title=state.level===MAX_LEVEL?'最大レベル':`EXP ${state.experience} / ${expNeed}`;
 $('hp-text').textContent=`${state.hp} / ${st.maxHp}`;$('hp-bar').style.width=`${state.hp/st.maxHp*100}%`;$('hp-bar').style.background=state.hp<st.maxHp*.3?'#bd8073':'#91ae88';
 $('atk').textContent=displayAttack();$('def').textContent=displayDefense();$('shards').innerHTML=`${state.shards} <em>pt</em>`;$('intent').textContent=prep?'出発の準備をしています':state.intent;
 const notices={cleared:[`${floorLabel(state)} Clear`,state.floor===LAST_FLOOR?'階段の先に、地上の光が見える。':'記憶の欠片を手に入れた。次の階の準備へ。'],dead:['途切れた記憶','骸は崩れ、再び最深部へ。図鑑の記録は残ります。'],ending:['届かなかった声','「父の仇……魔物め」<br>息子の剣が、骸を貫いた。<br>父だと伝える声は、もう出なかった。<br><br>記憶を失い、再びB30へ。<br>通常エンド達成 · 次の旅ではB15の手紙を開けられます。']};
 const hint=['cleared','dead','ending'].includes(state.phase)?(state.nextHint||nextStageHint(state)):null;
 $('field-gimmick').hidden=!state.gimmick||state.gimmick.id==='none';$('field-gimmick').textContent=state.gimmick&&state.gimmick.id!=='none'?'異変：'+state.gimmick.name+(state.gimmick.id==='fog'?' · 視界−2':''):'';
 const resting=state.phase==='explore'&&paused&&!document.querySelector('dialog[open]');
 const n=notices[state.phase]||(resting?['ひとやすみ','少し骨を休めよう。下の「探索を再開」で旅を続けられます。']:null);$('map-notice').hidden=!n;$('map-notice').classList.toggle('has-hint',Boolean(n&&hint));
 $('notice-copy').innerHTML=n?'<strong>'+n[0]+'</strong><small>'+n[1]+'</small>':'';
 $('notice-hint').innerHTML=hint?'<div class="clear-hint"><h3>'+esc(hint.title.replace(/^次は/,''))+'</h3><p>'+esc(hint.text)+'</p></div>':'';
 $('primary').innerHTML=({awakening:'思い出す',prepare:'探索を始める',cleared:state.floor===LAST_FLOOR?'地上1Fへ':'準備画面へ',dead:'B30で再び目覚める',ending:'次の旅をはじめる'})[state.phase]||'';
 $('primary').hidden=state.phase==='explore';$('pause-toggle').hidden=state.phase!=='explore';$('pause-toggle').textContent=paused?'探索を再開':'ひとやすみ';
 $('prep-note').textContent='能力強化・指示枠の拡張・装備変更は準備中のみ。取得した再生・転移は準備でカード指示に設定。';
 renderJourneyLog();
 $('memory-count').textContent=`記憶の断片 ${state.memories.length} / 4 · 通常エンド ${state.profile.normalClears}回`;
 $('memory-quote').textContent=state.memories.at(-1)||'名前も、顔も、思い出せない。それでも、帰らなければ。';
 renderTab();renderThoughtSubtitle();draw();save();
}
function renderJourneyLog(){
 const host=$('logs'),overlay=document.body.classList.contains('exploring'),rows=state.logs.slice(0,30),signature=JSON.stringify([overlay,rows]);
 fieldLogVisibility.sync(overlay,JSON.stringify(rows));
 if(host.dataset.signature===signature)return;
 const modeChanged=host.dataset.overlay!==String(overlay),follow=host.scrollHeight-host.clientHeight-host.scrollTop<8||modeChanged,top=host.scrollTop;
 host.dataset.signature=signature;host.dataset.overlay=String(overlay);
 host.innerHTML=(overlay?rows.reverse():rows).map(l=>`<div class="log-row ${esc(l.type)}"><time>${String(l.turn).padStart(3,'0')}</time><span>${esc(l.text.replace(/記憶のかけら|かけら/g,'記憶の欠片'))}</span></div>`).join('');
 host.scrollTop=overlay&&follow?host.scrollHeight:modeChanged?0:top;
}
function itemCard(g,ref,equipped=false){
 const b=gearById[g.baseId],st=gearStats(g),target=typeof ref==='number'?'i'+ref:ref;
 return '<article class="item-card"><div><small>'+ (b.slot==='weapon'?'武器':'防具')+(equipped?' · 装備中':'')+'</small><strong>'+esc(gearName(g))+'</strong><small>攻撃 '+st.attack+' / 防御 '+st.defense+'</small></div>'+(!equipped?'<div class="item-actions"><button data-action="equip" data-ref="'+target+'">装備</button><button data-action="discard" data-ref="'+target+'" class="text-button">処分</button></div>':'')+'</article>';
}
function renderMemories(){
 const focused=document.activeElement?.dataset.upgrade;
 $('tab-content').innerHTML='<div class="memory-toolbar"><span>スキルツリー <b>'+state.shards+' pt</b></span><small>難易度：深淵</small></div><p class="section-caption">記憶の欠片で能力と指示枠を強化できます。指示行数と1行のカード数を別々に拡張できます。スキルカードは探索で取得します。</p>'+memoryGroups.map(group=>'<section class="memory-list-group"><h3>'+group.name+'</h3>'+group.ids.map(id=>{
  const k=skills.find(k=>k.id===id),lv=state.levels[id],max=lv>=k.max,dep=skills.find(p=>p.id===k.requires),disabled=max||locked(state,k)||state.floor===1||state.phase!=='prepare'||state.shards<price(state,k);
  const status=max?'習得済み':locked(state,k)?'未解放':state.floor===1?'B29から習得可能':state.shards<price(state,k)?'記憶の欠片不足':'習得する';
  return '<article class="memory-list-card"><span class="skill-icon" aria-hidden="true">'+k.icon+'</span><div><strong>'+esc(k.name)+' <small>Lv.'+lv+' / '+k.max+'</small></strong><p>'+esc(k.detail)+'</p>'+(dep?'<small>前提：'+esc(dep.name)+' Lv.1</small>':'')+'</div><button data-upgrade="'+id+'" '+(disabled?'disabled':'')+' aria-label="'+esc(k.name+' '+status)+'">'+status+(max?'':' · '+price(state,k)+' pt')+'</button></article>';
 }).join('')+'</section>').join('');
 if(focused)document.querySelector('[data-upgrade="'+focused+'"]')?.focus({preventScroll:true});
}
function renderTab(){
 if(tab==='skills')renderMemories();
 if(tab==='gear'){$('tab-content').innerHTML='<div class="equipment-toolbar"><button data-best-equipment class="primary">最強装備</button><small>武器は攻撃力、防具は防御力で選びます。</small></div>'+categoryTabs('gear',gearSlot)+sortButtons('gear',gearSorts[gearSlot])+'<p class="section-caption">本編の装備は鑑定済み・呪いなし。入手順は古い順、攻撃力順・防御力順は高い順です。</p>'+itemCard(state.gear[gearSlot],gearSlot,true)+`<h3>所持品</h3>`+(sortedInventory(state,gearSlot,gearSorts[gearSlot]).map(({g,index})=>itemCard(g,index)).join('')||'<p class="section-caption">この種類の装備はありません。</p>');}
 if(tab==='orders'){delete $('tab-content').dataset.orderSignature;renderOrderEditor($('tab-content'));}

}
function renderScreens(){
 const prep=state.phase==='prepare',awake=state.phase==='awakening',st=stats(state);$('workspace').dataset.screen=awake?'awakening':prep?'prepare':'explore';document.body.classList.toggle('exploring',!prep&&!awake);document.body.classList.toggle('preparing',prep);$('awakening-scene').hidden=!awake;$('game-icons').hidden=awake;const journal=document.querySelector('.journal');journal.hidden=awake;const journalHost=awake?$('workspace'):prep?$('prep-journal-content'):$('field-log-host');if(journal.parentElement!==journalHost)journalHost.appendChild(journal);const toolsHost=awake?$('header-tools'):$('hud-tools');if($('utility-controls').parentElement!==toolsHost)toolsHost.appendChild($('utility-controls'));
 $('prepare-scene').hidden=!prep;document.querySelector('.adventure').hidden=awake;$('expedition').hidden=awake;const statusHost=awake?$('workspace'):$('status-dialog-content');if($('expedition').parentElement!==statusHost)statusHost.appendChild($('expedition'));$('status-open').hidden=awake;$('fullscreen-open').hidden=prep||awake;$('mobile-display').hidden=prep||awake;if((prep||awake)&&ownsFullscreen&&document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});$('live-order-panel').hidden=prep;$('status-phase').textContent=prep?'PREPARATION':'EXPEDITION';
 $('prepare-floor').textContent=`${floorLabel(state)}への支度`;
 const host=awake?$('awakening-start'):prep?$('launch-area'):$('notice-actions');if($('primary').parentElement!==host)host.prepend($('primary'));
 const visited=state.visited.flat().filter(Boolean).length;
 const summary=`<dl class="stat-list"><div><dt>レベル / 経験値</dt><dd>Lv.${state.level} / ${state.level===MAX_LEVEL?'MAX':state.experience+' / '+experienceToNext(state.level)}</dd></div><div><dt>HP</dt><dd>${state.hp} / ${st.maxHp}</dd></div><div><dt>攻撃力 / 防御力</dt><dd>${displayAttack()} / ${displayDefense()}</dd></div><div><dt>記憶の欠片</dt><dd id="shards">${state.shards} pt</dd></div><div><dt>武器</dt><dd>${esc(gearName(state.gear.weapon))}${state.gear.weapon.boundKnown?' · 呪い':''}</dd></div><div><dt>防具</dt><dd>${esc(gearName(state.gear.armor))}${state.gear.armor.boundKnown?' · 呪い':''}</dd></div><div><dt>鍵</dt><dd>${state.keys}個</dd></div><div><dt>指示枠</dt><dd>${state.orders.length} / ${orderCapacity(state)}枠</dd></div><div><dt>1行のカード枠</dt><dd>${cardCapacity(state)}枚</dd></div><div><dt>視界範囲</dt><dd>半径${radius(state)}マス</dd></div><div><dt>再生の祈り</dt><dd>${state.abilities.includes('mend')?(state.mended?'使用済み':state.orders.some(o=>o.effect?.id==='mend')?'使用可能':'指示未設定'):'未習得'}</dd></div></dl>`;

 $('expedition-summary').innerHTML=summary+`<div class="current-action"><small>今の判断</small><p>${esc(prep?'出発の準備をしています':state.intent)}</p></div><dl class="stat-list"><div><dt>探索済みの床 / この階の撃破</dt><dd>${visited}マス / ${state.floorKills}体</dd></div><div><dt>所持品 / 手紙</dt><dd>${state.inventory.length}個 / ${state.letter?'入手済':'未入手'}</dd></div></dl><h3>習得した記憶</h3><p class="section-caption">${skills.filter(k=>state.levels[k.id]).map(k=>k.name+(k.max>1?' Lv.'+state.levels[k.id]:'')).join(' / ')||'未習得'}</p><h3>この旅で得たスキル・特殊指示</h3><p class="section-caption">${[...state.abilities,...state.unlockedOrders].map(id=>esc(rewardDefinitions.find(r=>r.id===id).name)).join(' / ')||'未取得'}<br>特殊指示は準備中に探索指示へ設定して使います。</p>`;
 renderOrderEditor($('live-orders'));
}
function openDialog(id){if(!document.querySelector('dialog[open]'))dialogWasPaused=paused;paused=true;$(id).showModal();if(state.phase==='explore')render();}
function finishDialog(){if(!document.querySelector('dialog[open]')){paused=dialogWasPaused;last=performance.now();render();}}
function renderCodex(){if(codexKind==='skills'){const rows=codexRows(state,'skills');$('codex-title').textContent='スキル図鑑';$('codex-note').textContent='ドロップ・宝箱で取得したスキルと特殊指示を登録。記録は周回で保持し、効果はその旅だけ。';$('codex-body').innerHTML=`<p class="section-caption">登録済み ${rows.filter(r=>r.known).length} / ${rows.length}</p>`+rows.map(r=>r.known?`<article class="item-card"><strong>${esc(r.name)}</strong><small>${r.kind==='skill'?'戦闘スキル':'特殊探索指示'} · ${r.owned?'この旅で取得済み':'この旅では未取得'}</small><p>${esc(r.detail)}</p></article>`:'<article class="item-card"><span aria-label="未登録">？</span></article>').join('');return;}let rows=codexRows(state,codexKind);if(codexKind==='equipment')rows=rows.filter(r=>r.slot===codexSlot).sort((a,b)=>Number(b.known)-Number(a.known)||(a.known&&b.known?(codexSorts[codexSlot]==='acquired'?a.acquiredOrder-b.acquiredOrder:b[codexSorts[codexSlot]]-a[codexSorts[codexSlot]]):0));$('codex-title').textContent=codexKind==='monsters'?'モンスター図鑑':'装備図鑑';$('codex-note').textContent=codexKind==='monsters'?'視認した種類を登録。記録は周回でも引き継ぎます。':'入手した種類の名前と能力を登録。記録は周回でも引き継ぎます。';$('codex-body').innerHTML=(codexKind==='equipment'?categoryTabs('codex',codexSlot)+sortButtons('codex',codexSorts[codexSlot]):'')+`<p class="section-caption">公開済み ${rows.filter(r=>r.known).length} / ${rows.length}</p><table class="codex-table"><thead><tr><th>名前</th><th>攻撃</th><th>防御</th></tr></thead><tbody>${rows.map(r=>r.known?`<tr><td>${esc(r.name)}${r.zone?`<small>${esc(r.zone)}</small>`:''}</td><td>${r.attack}</td><td>${r.defense}</td></tr>`:'<tr><td><span aria-label="未登録">？</span></td><td>―</td><td>―</td></tr>').join('')}</tbody></table>`;}
function showCodex(kind){codexKind=kind;renderCodex();openDialog('codex-dialog');}
const getRef=r=>r.startsWith('i')?Number(r.slice(1)):r;
$('tab-content').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-best-equipment')){equipBest(state);render();return;}if(b.dataset.category){const type=b.dataset.category;if(type==='gear')gearSlot=b.dataset.value;}else if(b.dataset.sort){gearSorts[gearSlot]=b.dataset.value;}else if(handleOrderClick(e,$('tab-content')))return;else if(b.dataset.upgrade){if(upgrade(state,b.dataset.upgrade))tone(550);}else if(b.dataset.action){const ref=getRef(b.dataset.ref);switch(b.dataset.action){case'equip':equip(state,ref);break;case'discard':discard(state,ref);break;}}render();};
$('live-orders').onclick=e=>handleOrderClick(e,$('live-orders'));
$('live-orders').onchange=handleOrderChange;
$('tab-content').onchange=handleOrderChange;
$('codex-body').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.category)codexSlot=b.dataset.value;else if(b.dataset.sort)codexSorts[codexSlot]=b.dataset.value;renderCodex();};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));renderTab();});
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
function reset(next=newGame(undefined,state.profile)){state=next;paused=false;motion=null;last=performance.now();render();}
$('primary').onclick=()=>{if(state.phase==='explore')return;if(['awakening','prepare'].includes(state.phase)){beginExploration(state);paused=false;last=performance.now();tone();}else if(state.phase==='cleared'){ascend(state);motion=null;tone(440);}else reset();render();if(state.phase==='explore')tryMobileDisplay();};
$('abandon-run').onclick=()=>{if(state.phase==='prepare')openDialog('abandon-dialog');};
$('confirm-abandon').onclick=()=>{const next=abandonRun(state);if(!next)return;$('abandon-dialog').close();reset(next);};
$('pause-toggle').onclick=()=>{if(state.phase!=='explore')return;paused=!paused;last=performance.now();render();if(!paused)tryMobileDisplay();};
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'効果音を無効にする':'効果音を有効にする');$('sound').textContent='効果音：'+(sound?'ON':'OFF');tone(440);};
$('skill-book').onclick=()=>showCodex('skills');$('monster-book').onclick=()=>showCodex('monsters');$('equipment-book').onclick=()=>showCodex('equipment');
$('help').onclick=()=>openDialog('dialog');$('close-dialog').onclick=()=>$('dialog').close();$('guide-start').onclick=()=>$('dialog').close();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',finishDialog));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='explore'){paused=true;dialogWasPaused=true;render();}});
function debugStatus(message=''){ $('debug-status').textContent=`${floorLabel(state)} · Lv.${state.level} · EXP ${state.experience} · HP ${state.hp}/${stats(state).maxHp} · ${state.shards}pt${state.debugUsed?' · DEBUG操作済み':''}${message?' — '+message:''}`;}
function displayMessage(text){$('fullscreen-status').textContent=text;$('mobile-display').textContent=text||'横向きで全画面表示';}
async function enterDisplay(){
 const result=await requestLandscapeDisplay(document.documentElement,screen.orientation);ownsFullscreen=result.fullscreen;lockedOrientation=result.landscape;
 displayMessage(result.landscape?'横向きの全画面表示中です。':result.fullscreen?'全画面表示中です。端末を横向きにしてください。':'端末を横向きにしてください（全画面表示はこのブラウザで利用できません）。');
 $('fullscreen-open').textContent=result.fullscreen?'全画面表示を終了':'横向きで全画面表示';
}
function tryMobileDisplay(){if(!autoDisplayAttempted&&matchMedia('(pointer: coarse)').matches){autoDisplayAttempted=true;void enterDisplay();}}
$('fullscreen-open').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else void enterDisplay();};
$('mobile-display').onclick=()=>void enterDisplay();
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){if(lockedOrientation)screen.orientation?.unlock?.();lockedOrientation=false;ownsFullscreen=false;$('fullscreen-open').textContent='横向きで全画面表示';displayMessage('横向きで全画面表示');}});
$('status-open').onclick=()=>openDialog('status-dialog');
$('prepare-status').onclick=()=>openDialog('status-dialog');
$('prepare-journal').onclick=()=>openDialog('prep-journal-dialog');
$('sound-volume').oninput=e=>{volume=Number(e.target.value);$('volume-value').textContent=volume+'%';};
$('sound-volume').onchange=()=>tone(440);
$('options-open').onclick=()=>openDialog('options-dialog');
$('debug-open').onclick=()=>{$('debug-floor').innerHTML=Array.from({length:LAST_FLOOR},(_,i)=>`<option value="${i+1}" ${state.floor===i+1?'selected':''}>B${LAST_FLOOR-i}</option>`).join('');$('debug-gear').innerHTML=equipment.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');$('debug-reward').innerHTML=rewardDefinitions.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');debugStatus();openDialog('debug-dialog');};
$('debug-dialog').addEventListener('click',e=>{const b=e.target.closest('[data-debug]');if(!b)return;let message='';switch(b.dataset.debug){case'jump':debugJump(state,Number($('debug-floor').value));break;case'next':debugJump(state,Math.min(LAST_FLOOR,state.floor+1));break;case'previous':debugJump(state,Math.max(1,state.floor-1));break;case'experience':{const gained=gainExperience(state,10);state.debugUsed=true;message=state.level===MAX_LEVEL&&!gained?'最大レベル':`経験値+10 / Lv.${state.level}${gained?' / HP +'+gained*HP_PER_LEVEL:''}`;break;}case'heal':debugHeal(state);break;case'shards':debugShards(state);break;case'skills':debugSkills(state);break;case'keys':state.keys+=3;state.debugUsed=true;message='鍵を3個追加';break;case'reward':{const id=$('debug-reward').value;grantReward(state,id);state.debugUsed=true;message='報酬を取得';break;}case'equipment':if(!debugEquipment(state,$('debug-gear').value,{plus:Number($('debug-plus').value),identified:true}))message='強化値は0〜20の整数にしてください';break;case'export':{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`abyss-save-${floorLabel(state).replace(/ /g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message='セーブを書き出しました';break;}case'reset-run':if(confirm('現在の旅を初期化しますか？ 図鑑と通常エンド達成は残します。'))reset();break;case'reset-all':if(confirm('このゲームの全セーブ・図鑑・通常エンド達成・旧版・バックアップを削除します。元に戻せません。初期化しますか？')){try{for(const k of Object.keys(localStorage))if(k===key||k.startsWith(key+'-')||k==='abyss-prototype-v1')localStorage.removeItem(k);state=newGame();motion=null;paused=true;message='全データを初期化しました';}catch{message='保存領域にアクセスできず初期化できませんでした';}}break;}
 motion=null;render();debugStatus(message);});
$('debug-import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const loaded=normalizeSave(JSON.parse(await file.text()));if(!loaded)throw Error('このゲームの有効なセーブではありません');if(confirm('選択したセーブで現在の進行と図鑑・達成記録を置き換えますか？')){try{localStorage.setItem(key+'-before-import',JSON.stringify(state));}catch{}state=loaded;motion=null;paused=true;dialogWasPaused=true;render();debugStatus('セーブを読み込みました');}}catch(err){debugStatus('読み込み失敗：'+err.message);}e.target.value='';};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function loop(t){if(state.phase==='explore'&&!paused&&!document.querySelector('dialog[open]')&&t-last>420/speed){last=t;const old=state.phase;motion={from:{...state.player},time:t,duration:reducedMotion.matches?1:Math.min(190,340/speed)};tick(state);damagePopups=queueDamage(damagePopups,state.damageEvents||[],t);if(Math.abs(state.player.x-motion.from.x)+Math.abs(state.player.y-motion.from.y)>1)motion=null;if(state.flash?.kind==='hit')tone(180);if(state.phase!==old){motion=null;tone(state.phase==='dead'?110:660);}render();}if(state.phase==='explore'&&(!paused||motion&&t-motion.time<motion.duration+50)||damagePopups.length)draw();requestAnimationFrame(loop);}
new ResizeObserver(()=>draw()).observe($('map'));
const hudObserver=new ResizeObserver(()=>{const wrap=$('map-wrap'),gap=wrap.clientWidth<=480?8:20;wrap.style.setProperty('--hud-top-space',($('hud-top').offsetHeight+gap)+'px');wrap.style.setProperty('--hud-bottom-space',($('hud-bottom').offsetHeight+gap)+'px');const available=wrap.clientHeight-$('hud-top').offsetHeight-$('hud-bottom').offsetHeight-$('field-log-host').offsetHeight-52;wrap.style.setProperty('--minimap-limit',Math.max(64,(available-22)*31/23)+'px');});hudObserver.observe($('hud-top'));hudObserver.observe($('hud-bottom'));hudObserver.observe($('field-log-host'));
installCardDragging($('tab-content'),()=>state,()=>{delete $('tab-content').dataset.orderSignature;render();});
sprite($('portrait').getContext('2d'),'skeleton',4,3,48);sprite($('camp-portrait').getContext('2d'),'skeleton',12,8,96);render();requestAnimationFrame(loop);
