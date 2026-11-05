import{augmentStrength,augmentName}from'./augment-strength.js';
import{THEME_IMAGES}from'./augment-art.js';
import{themeById,themedSkillById}from'./build-themes.js';
import{skillSetActive,setBonusRows,SET_EFFECTS,themeStars}from'./set-bonuses.js';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function themeIcon(id){const t=themeById[id];return t?'<img class="theme-icon" src="'+THEME_IMAGES[id]+'" width="64" height="64" alt="'+esc(t.name)+'">':'';}
export function skillThemeBadge(c,s){if(!c?.themeId)return '';const active=skillSetActive(s,c.id),t=themeById[c.themeId];return '<span class="skill-theme-badge '+(active?'set-active':'')+'" title="'+esc(t.name+'：'+(active?'セットボーナス発動中。':'同テーマのオーグメントを所持して配置すると、オーグメントが強化。')+SET_EFFECTS[t.id])+'">'+themeIcon(t.id)+'<small>'+esc(t.name)+'</small>'+''+'</span>';}
export function setRibbon(s){const rows=setBonusRows(s).filter(t=>t.skills.length);return '<div class="set-bonus-ribbon" aria-label="セットボーナス">'+(rows.length?rows.map(t=>'<span class="set-bonus-chip" title="'+esc(t.detail)+'">'+themeIcon(t.id)+'<b>'+esc(t.name)+'</b> '+t.skills.length+'種 · '+themeStars(s,t.id)+'★ · オーグメント性能'+[1,1.25,1.5,2][themeStars(s,t.id)]+'倍</span>').join(''):'<small>同テーマのスキルを有効な指示に配置すると、オーグメントが強化されます（1／3／6種）。</small>')+'</div>';}
export function augmentSetHint(a,s,{preview=false}={}){if(!s||!a.themeId)return '';const copy=preview?{...s,augments:[...s.augments,a.id]}:s,active=setBonusRows(copy).find(t=>t.id===a.themeId)?.skills.length;return '<small class="augment-set-hint '+(active?'active':'')+'">'+(active?(preview?'選ぶとセット発動':'セット発動中'):'同テーマのスキル配置でオーグメント強化')+'<br>'+esc(SET_EFFECTS[a.themeId])+'</small>';}

export function skillTitle(c,s){return (c?.detail||c?.name||'')+(c?.themeId?' ／ '+themeById[c.themeId].name+'：'+(skillSetActive(s,c.id)?'セット発動中。':'同テーマの記憶を強化する配置。')+SET_EFFECTS[c.themeId]:'');}

export function skillSetEffect(k){return '同テーマのオーグメント強化に寄与（スキル性能は変化なし）';}
export function augmentHoverText(a,s){return augmentName(a,s)+'\n'+augmentStrength(a,s)+'\nセット効果：'+SET_EFFECTS[a.themeId]+(s?'\n配置中：'+(setBonusRows(s).find(t=>t.id===a.themeId)?.skills.map(k=>k.name+'：'+skillSetEffect(k)).join(' ／ ')||'対象スキルなし'):'');}
