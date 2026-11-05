import{buildThemes,themedSkills,themeById,themedAugments}from'./build-themes.js';
const augTheme=Object.fromEntries(themedAugments.map(a=>[a.id,a.themeId]));
export function skillSetActive(s,id){const skill=themedSkills.find(c=>c.id===id);return Boolean(skill&&s.ownedCards?.includes('skill:'+id)&&(s.abilities?.includes(id)||id==='warp'&&s.unlockedOrders?.includes(id))&&s.augments?.some(a=>augTheme[a]===skill.themeId)&&s.orders?.some(r=>r.cards&&!r.disabled&&r.target==='self'&&r.effect?.kind==='skill'&&r.effect.id===id));}
export function setBonusRows(s){return buildThemes.map(t=>({...t,augments:(s.augments||[]).filter(a=>augTheme[a]===t.id),skills:themedSkills.filter(k=>k.themeId===t.id&&skillSetActive(s,k.id)),detail:SET_EFFECTS[t.id]}));}

export const SET_EFFECTS=Object.fromEntries(buildThemes.map(t=>[t.id,'有効な指示に配置した同テーマの異なるスキル1／3／6種で★1／2／3。オーグメントの性能1.25／1.5／2倍。スキルの基本性能は変わりません。']));
export function themeStars(s,theme){if(!theme||!s.augments?.some(id=>augTheme[id]===theme))return 0;const owned=new Set(s.ownedCards||[]),unlocked=new Set([...(s.abilities||[]),...((s.unlockedOrders||[]).includes('warp')?['warp']:[])]),eligible=new Set(themedSkills.filter(k=>k.themeId===theme&&owned.has('skill:'+k.id)&&unlocked.has(k.id)).map(k=>k.id)),placed=new Set((s.orders||[]).filter(r=>r.cards&&!r.disabled&&r.target==='self'&&r.effect?.kind==='skill'&&eligible.has(r.effect.id)).map(r=>r.effect.id)),n=placed.size;return n>=6?3:n>=3?2:n>=1?1:0;}
export function augmentStars(s,id){return themeStars(s,augTheme[id]);}
export function augmentPower(s,id){return [1,1.25,1.5,2][augmentStars(s,id)];}
export function augmentValue(s,id,n,integer=false){const v=n*augmentPower(s,id);return integer?Math.ceil(v-1e-9):v;}
export function starText(s,id){const n=augmentStars(s,id);return n?'★'.repeat(n)+'☆'.repeat(3-n):'';}
