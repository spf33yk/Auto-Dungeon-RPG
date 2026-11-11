import{themedSkillById}from'./build-themes.js';
import {bossMemory} from './story-text.js';
export const willFoundMessage={kind:'will',text:'遺書を手に入れた'};
export function bossMemoryMessage(floor,normalClears){
 const text=bossMemory(floor,normalClears);
 return text?{kind:normalClears>0?'memory':'story',text}:null;
}
const sceneKey=s=>[s.seed,s.profile?.runs,s.floor].join(':');
export function captureFieldMessages(s){return {scene:sceneKey(s),turn:s.turn,house:s.gimmick?.id,triggered:Boolean(s.gimmick?.triggered),used:[...(s.themeState?.used||[])],boss:s.enemies?.some(e=>e.boss),letter:s.letter};}
export function collectFieldMessages(before,s){
 if(before.scene!==sceneKey(s)||before.turn===s.turn)return [];
 const messages=[];
 if(!before.letter&&s.letter)messages.push(willFoundMessage);
 if(before.boss&&!s.enemies?.some(e=>e.boss)){
  const memory=bossMemoryMessage(s.floor,s.profile?.normalClears);
  if(memory)messages.push(memory);
 }
 if(!before.triggered&&before.house===s.gimmick?.id&&s.gimmick?.triggered&&['monsters','traps'].includes(s.gimmick.id))messages.push({kind:'house',text:s.gimmick.id==='monsters'?'モンスターハウスだ！！':'トラップハウスだ！！'});
 const used=new Set(before.used);
 for(const id of s.themeState?.used||[])if(!used.has(id)&&themedSkillById[id]){messages.push({kind:'skill',skill:id,text:'「'+themedSkillById[id].name+'」を発動！'});used.add(id);}
 return messages;
}
export class FieldMessageQueue{
 constructor(){this.scene=null;this.messages=[];}
 sync(s){const key=sceneKey(s);if(this.scene===key)return false;this.scene=key;this.messages=[];return true;}
 push(messages){this.messages.push(...messages);}
 get active(){return this.messages.length>0;}
 get current(){return this.messages[0]||null;}
 advance(){return this.messages.shift()||null;}
 clear(){this.messages=[];}
}
// UI-only queue: no engine, save, RNG or pause-flag mutations.
export const SKILL_MESSAGE_MS=2000;
export const houseEntryReady=(motion,time)=>!motion||time>=motion.time+motion.duration;
export function fieldMessageLayout(r,hud){
 const top=Number.isFinite(r.top)?r.top:r.bottom-r.height,inset=Math.min(8,r.width*.02),width=Math.max(1,r.width*.76),bottom=Math.max(r.height*.115,hud.height+12),height=Math.max(1,Math.min(Math.max(72,r.height*.14),r.height-bottom-inset)),left=Math.round((r.left+(r.width-width)/2)*1000)/1000,y=Math.max(top+inset,r.bottom-bottom-height);
 return {left,top:y,width,height,font:Math.max(12,Math.min(42,r.width*.022,height*.28)),padding:Math.max(4,Math.min(12,height*.12))};
}

export function installFieldMessages({dialog,button,text,skillBox,skillText,host,hud,onIdle}){
 // A body-level fixed layer avoids a transformed ancestor applying coordinates twice.
 const body=host.ownerDocument?.body;
 if(body){
  if(dialog.parentElement!==body)body.appendChild(dialog);
  if(skillBox.parentElement!==body)body.appendChild(skillBox);
 }
 const queue=new FieldMessageQueue(),skills=new FieldMessageQueue();let displayed=null,remaining=0,lastTime=null;
 const visibility=()=>host.classList?.toggle('has-field-message',dialog.open||!skillBox.hidden);
 const position=element=>{
  const map=host.getBoundingClientRect();
  const viewport=host.ownerDocument?.documentElement;
  const bounds=(map.width&&map.height)||!viewport?map:{top:0,left:0,bottom:viewport.clientHeight,width:viewport.clientWidth,height:viewport.clientHeight};
  const box=fieldMessageLayout(bounds,hud.getBoundingClientRect());
  Object.assign(element.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',minHeight:'0',boxSizing:'border-box'});
  element.style.setProperty('--field-message-font',box.font+'px');
  element.style.setProperty('--field-message-padding',box.padding+'px');
 };
 const willPage=dialog.querySelector('#will-document'),willClose=dialog.querySelector('#will-close');
 const place=()=>{if(dialog.open&&dialog.dataset.kind!=='will')position(dialog);if(!skillBox.hidden)position(skillBox);visibility();};
 const render=({ready=true}={})=>{
  if(!ready)return;
  if(!queue.active){visibility();return;}
  const {kind,text:message}=queue.current,reading=kind==='will';
  dialog.dataset.kind=kind;
  dialog.setAttribute('aria-label',reading?'取得した遺書':'探索イベント');
  button.hidden=reading;willPage.hidden=!reading;
  text.textContent=message;button.setAttribute('aria-label',message+' クリック、タップ、Enterで続ける');
  if(!dialog.open)dialog.showModal();
  place();(reading?willClose:button).focus({preventScroll:true});
 };
 const advance=()=>{if(!queue.active)return;queue.advance();if(queue.active)render();else{dialog.close();onIdle();}};
 button.addEventListener('click',advance);
 willClose.addEventListener('click',advance);
 dialog.addEventListener('cancel',e=>{e.preventDefault();advance();});
 dialog.addEventListener('close',()=>{if(queue.active){queue.clear();onIdle();}});
 const animate=(time,blocked=false)=>{
  const elapsed=lastTime===null?0:Math.max(0,Math.min(100,time-lastTime));lastTime=time;
  if(blocked||queue.active||!skills.active){skillBox.hidden=true;visibility();return;}
  if(displayed!==skills.current){displayed=skills.current;remaining=SKILL_MESSAGE_MS;}else remaining-=elapsed;
  if(remaining<=0){skills.advance();displayed=skills.current;remaining=SKILL_MESSAGE_MS;}
  if(!displayed){skillBox.hidden=true;visibility();return;}
  if(skillText.textContent!==displayed.text)skillText.textContent=displayed.text;
  skillBox.hidden=false;position(skillBox);visibility();
 };
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(place);observer.observe(host);observer.observe(hud);}
 return {get active(){return queue.active;},get waiting(){return queue.active&&!dialog.open;},sync(s){if(queue.sync(s)&&dialog.open)dialog.close();if(skills.sync(s)){displayed=null;lastTime=null;skillBox.hidden=true;}},push(messages){queue.push(messages.filter(m=>m.kind!=='skill'));skills.push(messages.filter(m=>m.kind==='skill'));},render,place,animate};
}
