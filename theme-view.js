import{THEME_IMAGES}from'./augment-art.js';
import{themeById,themedSkillById}from'./build-themes.js';
import{skillSetActive,setBonusRows,SET_EFFECTS}from'./set-bonuses.js';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function themeIcon(id){const t=themeById[id];return t?'<img class="theme-icon" src="'+THEME_IMAGES[id]+'" width="64" height="64" alt="'+esc(t.name)+'">':'';}
export function skillThemeBadge(c,s){if(!c?.themeId)return '';const active=skillSetActive(s,c.id),t=themeById[c.themeId];return '<span class="skill-theme-badge '+(active?'set-active':'')+'" title="'+esc(t.name+'：'+(active?'セットボーナス発動中。':'同テーマのオーグメントを所持して配置すると強化。')+SET_EFFECTS[t.id])+'">'+themeIcon(t.id)+'<small>'+esc(t.name)+'</small>'+(active?'<b>SET</b>':'')+'</span>';}
export function setRibbon(s){const rows=setBonusRows(s).filter(t=>t.skills.length);return '<div class="set-bonus-ribbon" aria-label="セットボーナス">'+(rows.length?rows.map(t=>'<span class="set-bonus-chip" title="'+esc(t.detail)+'">'+themeIcon(t.id)+'<b>'+esc(t.name)+'</b> セット発動 · '+t.skills.length+'種：'+esc(t.skills.map(k=>k.name+' '+skillSetEffect(k)).join(' ／ '))+'</span>').join(''):'<small>同テーマのオーグメントと、有効な指示に配置したスキルでセットボーナスが発動します。</small>')+'</div>';}
export function augmentSetHint(a,s,{preview=false}={}){if(!s||!a.themeId)return '';const copy=preview?{...s,augments:[...s.augments,a.id]}:s,active=setBonusRows(copy).find(t=>t.id===a.themeId)?.skills.length;return '<small class="augment-set-hint '+(active?'active':'')+'">'+(active?(preview?'選ぶとセット発動':'セット発動中'):'同テーマのスキル配置で強化')+'<br>'+esc(SET_EFFECTS[a.themeId])+'</small>';}

export function skillTitle(c,s){return (c?.detail||c?.name||'')+(c?.themeId?' ／ '+themeById[c.themeId].name+'：'+(skillSetActive(s,c.id)?'セット発動中。':'同テーマの記憶と配置で強化。')+SET_EFFECTS[c.themeId]:'');}

export function skillSetEffect(k){
 const specific={'blood-offering':'HP消費10%→7.5%（最大HP比）',frenzy:'ダメージ1.25倍・吸命率＋10%',bite:'ダメージ1.25倍・吸命率30%→40%','blood-cut':'ダメージ1.25倍・HP消費10%→7.5%（最大HP比）・吸命率＋10%',sweep:'ダメージ1.25倍・吸命率＋10%','life-burn':'ダメージ1.25倍・HP消費50%→37.5%（現在HP比）・吸命率50%→60%',scout:'持続10→15ターン','trap-step':'無効化1→2回',waymark:'隣の部屋→2部屋先まで',warp:'転移時に最大HPの10%回復',homeward:'帰還時に最大HPの10%回復',focus:'無被弾蓄積＋3→＋5','clear-mind':'無被弾蓄積＋5→＋7','iron-stance':'DEF＋3→＋4','shield-stance':'軽減1→2回',guard:'軽減3→4回',fortress:'回復量1.25倍・無敵2→3回','shield-bash':'敵の攻撃半減1→2回'};
 return specific[k.id]||({explorer:'回復量1.25倍',monk:'攻撃・回復量1.25倍',berserker:'ダメージ1.25倍・HP消費25%軽減・吸命率＋10%',guardian:'回復量1.25倍',gambler:'成功率50%→65%'}[k.themeId]||'');
}
export function augmentHoverText(a,s){return a.detail+'\nセット効果：'+SET_EFFECTS[a.themeId]+(s?'\n配置中：'+(setBonusRows(s).find(t=>t.id===a.themeId)?.skills.map(k=>k.name+'：'+skillSetEffect(k)).join(' ／ ')||'対象スキルなし'):'');}
