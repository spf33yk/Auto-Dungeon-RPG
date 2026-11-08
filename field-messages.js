import{themedSkillById}from'./build-themes.js';
const sceneKey=s=>[s.seed,s.profile?.runs,s.floor].join(':');
export function captureFieldMessages(s){return {scene:sceneKey(s),turn:s.turn,house:s.gimmick?.id,triggered:Boolean(s.gimmick?.triggered),used:[...(s.themeState?.used||[])]};}
export function collectFieldMessages(before,s){
 if(before.scene!==sceneKey(s)||before.turn===s.turn)return [];
 const messages=[];
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
export function installFieldMessages({dialog,button,text,skillBox,skillText,host,hud,onIdle}){
 const queue=new FieldMessageQueue(),skills=new FieldMessageQueue();let displayed=null,remaining=0,lastTime=null;
 const visibility=()=>host.classList?.toggle('has-field-message',dialog.open||!skillBox.hidden);
 const position=element=>{const r=host.getBoundingClientRect(),bottom=Math.max(r.height*.115,hud.getBoundingClientRect().height+12),height=Math.max(72,r.height*.14);Object.assign(element.style,{left:r.left+r.width*.12+'px',top:r.bottom-bottom-height+'px',width:r.width*.76+'px',minHeight:height+'px'});element.style.setProperty('--field-message-font',Math.max(16,Math.min(42,r.width*.022))+'px');};
 const place=()=>{if(dialog.open)position(dialog);if(!skillBox.hidden)position(skillBox);visibility();};
 const render=()=>{if(!queue.active){visibility();return;}if(!dialog.open)dialog.showModal();text.textContent=queue.current.text;dialog.dataset.kind=queue.current.kind;button.setAttribute('aria-label',queue.current.text+' クリック、タップ、Enterで続ける');place();button.focus({preventScroll:true});};
 const advance=()=>{if(!queue.active)return;queue.advance();if(queue.active)render();else{dialog.close();onIdle();}};
 button.addEventListener('click',advance);
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
 return {get active(){return queue.active;},sync(s){if(queue.sync(s)&&dialog.open)dialog.close();if(skills.sync(s)){displayed=null;lastTime=null;skillBox.hidden=true;}},push(messages){queue.push(messages.filter(m=>m.kind!=='skill'));skills.push(messages.filter(m=>m.kind==='skill'));},render,place,animate};
}
