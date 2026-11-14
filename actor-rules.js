// Target cards select the actor, never a second implicit subject.
export const ACTOR_RULE_REVISION=1;
export const retiredTargets=['target:weak-enemy','target:danger-enemy'];
const knownTargets=['target:self','target:enemy',...retiredTargets];
export const enemySkillReasons={
 'trap-step':'敵は罠を作動させないため',
 'treasure-bet':'骸の回収品を扱う技のため',
 homeward:'骸のフロア帰還用の技のため'
};
export const enemyUnsupportedSkills=new Set(Object.keys(enemySkillReasons));
export function actorCanUse(target,effect){
 if(!effect)return false;
 if(target==='self')return true;
 if(target!=='enemy')return false;
 return effect.cardKind==='skill'||effect.themeId
  ?!enemyUnsupportedSkills.has(effect.id)
  :['wait','retreat','frontier','explore-all'].includes(effect.id);
}
export function migrateActorRow(input){
 const r=structuredClone(input);
 if(!r||typeof r!=='object')return r;
 if(r.cards&&['enemy','weak-enemy','danger-enemy'].includes(r.target)){
  r.target='self';
  if(Array.isArray(r.conditions)&&r.conditions.some(c=>['hp-below','hp-above','one-hit','injured'].includes(c?.id)))r.disabled=true;
 }
 return r;
}
export function migrateActorRules(s){
 if(s.actorRuleRevision===ACTOR_RULE_REVISION)return;
 let retired=0;
 for(const p of [s,s.profile]){
  const key=p===s?'ownedCards':'cards';
  if(!Array.isArray(p?.[key]))continue;
  if(p===s)retired+=p[key].filter(k=>retiredTargets.includes(k)).length;
  p[key]=[...new Set(p[key].map(k=>knownTargets.includes(k)?'target:'+(k==='target:self'?'self':'enemy'):k))];
  for(const k of ['target:self','target:enemy'])if(!p[key].includes(k))p[key].push(k);
 }
 s.shards+=retired*5;
 s.orders=(s.orders||[]).map(migrateActorRow);
 const replacement=k=>knownTargets.includes(k)?(retiredTargets.includes(k)?'condition:hp-below':'condition:hp-above'):k;
 for(const i of s.items||[])if(i.cardId)i.cardId=replacement(i.cardId);
 if(s.cardOffer&&Array.isArray(s.cardOffer.choices)){
  s.cardOffer.choices=[...new Set(s.cardOffer.choices.map(replacement))];
  if(s.cardOffer.categories)for(const kind of Object.keys(s.cardOffer.categories)){
   if(Array.isArray(s.cardOffer.categories[kind]))s.cardOffer.categories[kind]=[...new Set(s.cardOffer.categories[kind].map(replacement))];
  }
 }
 s.actorRuleRevision=ACTOR_RULE_REVISION;
 s.logs?.unshift({text:'ターゲットを実行者指定へ移行。旧敵指定は自分へ置換し、HP等を参照する旧行は確認のため無効化。廃止ターゲットの補填 記憶の欠片 '+retired*5+'個。',type:'good',turn:s.turn});
}
export function roomContains(r,p){return p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h;}
