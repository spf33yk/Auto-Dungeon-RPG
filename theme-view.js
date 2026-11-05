import{THEME_IMAGES}from'./augment-art.js';
import{themeById,themedSkillById}from'./build-themes.js';
import{skillSetActive,setBonusRows,SET_EFFECTS}from'./set-bonuses.js';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function themeIcon(id){const t=themeById[id];return t?'<img class="theme-icon" src="'+THEME_IMAGES[id]+'" width="64" height="64" alt="'+esc(t.name)+'">':'';}
export function skillThemeBadge(c,s){if(!c?.themeId)return '';const active=skillSetActive(s,c.id),t=themeById[c.themeId];return '<span class="skill-theme-badge '+(active?'set-active':'')+'" title="'+esc(t.name+'：'+(active?'セットボーナス発動中。':'同テーマのオーグメントを所持して配置すると強化。')+SET_EFFECTS[t.id])+'">'+themeIcon(t.id)+(active?'<b>SET</b>':'')+'</span>';}
export function setRibbon(s){const rows=setBonusRows(s).filter(t=>t.skills.length);return '<div class="set-bonus-ribbon" aria-label="セットボーナス">'+(rows.length?rows.map(t=>'<span class="set-bonus-chip" title="'+esc(t.detail)+'">'+themeIcon(t.id)+'<b>'+esc(t.name)+'</b> セット発動 · '+t.skills.length+'種</span>').join(''):'<small>同テーマのオーグメントと、有効な指示に配置したスキルでセットボーナスが発動します。</small>')+'</div>';}
export function augmentSetHint(a,s,{preview=false}={}){if(!s||!a.themeId)return '';const copy=preview?{...s,augments:[...s.augments,a.id]}:s,active=setBonusRows(copy).find(t=>t.id===a.themeId)?.skills.length;return '<small class="augment-set-hint '+(active?'active':'')+'">'+(active?(preview?'選ぶとセット発動':'セット発動中'):'同テーマのスキル配置で強化')+'<br>'+esc(SET_EFFECTS[a.themeId])+'</small>';}

export function skillTitle(c,s){return (c?.detail||c?.name||'')+(c?.themeId?' ／ '+themeById[c.themeId].name+'：'+(skillSetActive(s,c.id)?'セット発動中。':'同テーマの記憶と配置で強化。')+SET_EFFECTS[c.themeId]:'');}
